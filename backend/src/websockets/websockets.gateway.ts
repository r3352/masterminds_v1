import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

interface AuthenticatedSocket extends Socket {
  user?: User;
}

export interface NotificationPayload {
  type: 'question_created' | 'answer_created' | 'answer_accepted' | 'vote_received' | 'bounty_awarded' | 'expert_routed' | 'payment_received';
  title: string;
  message: string;
  data: any;
  targetUserId?: string;
  targetGroupId?: string;
  timestamp: Date;
}

export interface LiveActivityPayload {
  type: 'user_online' | 'user_offline' | 'user_typing' | 'viewing_question';
  userId: string;
  username: string;
  data?: any;
  timestamp: Date;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:10021',
    credentials: true,
  },
  namespace: '/live',
})
export class WebSocketsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketsGateway.name);
  private connectedUsers = new Map<string, AuthenticatedSocket[]>(); // userId -> sockets
  private userPresence = new Map<string, { lastSeen: Date; status: 'online' | 'away' | 'busy' }>(); // userId -> presence
  private questionViewers = new Map<string, Set<string>>(); // questionId -> Set<userId>

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket, ...args: any[]) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      // Get user details
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.is_active) {
        this.logger.warn(`Invalid user ${payload.sub} attempted connection`);
        client.disconnect();
        return;
      }

      client.user = user;
      
      // Track user connections
      if (!this.connectedUsers.has(user.id)) {
        this.connectedUsers.set(user.id, []);
      }
      this.connectedUsers.get(user.id).push(client);

      // Update user presence
      this.userPresence.set(user.id, {
        lastSeen: new Date(),
        status: 'online',
      });

      // Join user to personal room
      client.join(`user:${user.id}`);

      // Join user to their groups
      if (user.group_memberships) {
        for (const membership of user.group_memberships) {
          client.join(`group:${membership.group.id}`);
        }
      }

      // Notify other users that this user is online
      this.broadcastUserPresence(user.id, 'online');

      this.logger.log(`User ${user.username} (${user.id}) connected with socket ${client.id}`);
      
      // Send initial data to client
      client.emit('connected', {
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
        },
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (!client.user) return;

    const userId = client.user.id;
    
    // Remove client from user connections
    if (this.connectedUsers.has(userId)) {
      const userSockets = this.connectedUsers.get(userId);
      const index = userSockets.indexOf(client);
      if (index !== -1) {
        userSockets.splice(index, 1);
      }
      
      // If no more connections for this user, mark as offline
      if (userSockets.length === 0) {
        this.connectedUsers.delete(userId);
        this.userPresence.set(userId, {
          lastSeen: new Date(),
          status: 'away',
        });
        this.broadcastUserPresence(userId, 'offline');
      }
    }

    // Remove from question viewers
    for (const [questionId, viewers] of this.questionViewers.entries()) {
      if (viewers.has(userId)) {
        viewers.delete(userId);
        this.server.to(`question:${questionId}`).emit('viewer_left', {
          questionId,
          userId,
          username: client.user.username,
          viewerCount: viewers.size,
        });
      }
    }

    this.logger.log(`User ${client.user.username} (${userId}) disconnected from socket ${client.id}`);
  }

  // Real-time notifications
  @SubscribeMessage('join_question')
  handleJoinQuestion(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { questionId: string },
  ) {
    if (!client.user) return;

    const { questionId } = data;
    client.join(`question:${questionId}`);

    // Track question viewers
    if (!this.questionViewers.has(questionId)) {
      this.questionViewers.set(questionId, new Set());
    }
    this.questionViewers.get(questionId).add(client.user.id);

    // Notify other viewers
    this.server.to(`question:${questionId}`).emit('viewer_joined', {
      questionId,
      userId: client.user.id,
      username: client.user.username,
      avatar_url: client.user.avatar_url,
      viewerCount: this.questionViewers.get(questionId).size,
    });
  }

  @SubscribeMessage('leave_question')
  handleLeaveQuestion(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { questionId: string },
  ) {
    if (!client.user) return;

    const { questionId } = data;
    client.leave(`question:${questionId}`);

    // Update viewers
    if (this.questionViewers.has(questionId)) {
      this.questionViewers.get(questionId).delete(client.user.id);
      
      this.server.to(`question:${questionId}`).emit('viewer_left', {
        questionId,
        userId: client.user.id,
        username: client.user.username,
        viewerCount: this.questionViewers.get(questionId).size,
      });
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { questionId?: string; answerId?: string },
  ) {
    if (!client.user) return;

    const room = data.questionId ? `question:${data.questionId}` : 
                 data.answerId ? `answer:${data.answerId}` : null;

    if (room) {
      client.to(room).emit('user_typing', {
        userId: client.user.id,
        username: client.user.username,
        isTyping: true,
        context: data,
      });
    }
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { questionId?: string; answerId?: string },
  ) {
    if (!client.user) return;

    const room = data.questionId ? `question:${data.questionId}` : 
                 data.answerId ? `answer:${data.answerId}` : null;

    if (room) {
      client.to(room).emit('user_typing', {
        userId: client.user.id,
        username: client.user.username,
        isTyping: false,
        context: data,
      });
    }
  }

  @SubscribeMessage('update_status')
  handleUpdateStatus(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { status: 'online' | 'away' | 'busy' },
  ) {
    if (!client.user) return;

    this.userPresence.set(client.user.id, {
      lastSeen: new Date(),
      status: data.status,
    });

    this.broadcastUserPresence(client.user.id, data.status);
  }

  @SubscribeMessage('get_online_users')
  handleGetOnlineUsers(@ConnectedSocket() client: AuthenticatedSocket) {
    const onlineUsers = [];
    
    for (const [userId, presence] of this.userPresence.entries()) {
      if (presence.status === 'online' && this.connectedUsers.has(userId)) {
        // Would typically fetch user details from database
        onlineUsers.push({
          userId,
          status: presence.status,
          lastSeen: presence.lastSeen,
        });
      }
    }

    client.emit('online_users', onlineUsers);
  }

  // Public methods for broadcasting from services
  sendNotificationToUser(userId: string, notification: NotificationPayload) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  sendNotificationToGroup(groupId: string, notification: NotificationPayload) {
    this.server.to(`group:${groupId}`).emit('notification', notification);
  }

  broadcastToQuestion(questionId: string, event: string, data: any) {
    this.server.to(`question:${questionId}`).emit(event, data);
  }

  broadcastGlobally(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Question lifecycle events
  onQuestionCreated(question: any) {
    const notification: NotificationPayload = {
      type: 'question_created',
      title: 'New Question',
      message: `${question.author.username} asked: ${question.title}`,
      data: { questionId: question.id },
      targetGroupId: question.target_group?.id,
      timestamp: new Date(),
    };

    if (question.target_group) {
      this.sendNotificationToGroup(question.target_group.id, notification);
    } else {
      this.broadcastGlobally('question_created', notification);
    }
  }

  onAnswerCreated(answer: any) {
    const notification: NotificationPayload = {
      type: 'answer_created',
      title: 'New Answer',
      message: `${answer.author.username} answered your question`,
      data: { 
        questionId: answer.question.id,
        answerId: answer.id,
      },
      targetUserId: answer.question.author.id,
      timestamp: new Date(),
    };

    // Notify question author
    this.sendNotificationToUser(answer.question.author.id, notification);

    // Broadcast to question viewers
    this.broadcastToQuestion(answer.question.id, 'answer_created', {
      answer: {
        id: answer.id,
        content: answer.content,
        author: {
          id: answer.author.id,
          username: answer.author.username,
          avatar_url: answer.author.avatar_url,
        },
        created_at: answer.created_at,
      },
    });
  }

  onAnswerAccepted(answer: any) {
    const notification: NotificationPayload = {
      type: 'answer_accepted',
      title: 'Answer Accepted!',
      message: `Your answer was accepted by ${answer.question.author.username}`,
      data: { 
        questionId: answer.question.id,
        answerId: answer.id,
      },
      targetUserId: answer.author.id,
      timestamp: new Date(),
    };

    this.sendNotificationToUser(answer.author.id, notification);
    this.broadcastToQuestion(answer.question.id, 'answer_accepted', {
      answerId: answer.id,
      acceptedBy: answer.question.author.username,
    });
  }

  onVoteReceived(vote: any) {
    const targetUserId = vote.question ? vote.question.author.id : vote.answer.author.id;
    const contentType = vote.question ? 'question' : 'answer';
    
    const notification: NotificationPayload = {
      type: 'vote_received',
      title: `${vote.vote_type === 'up' ? 'Upvote' : 'Downvote'} Received`,
      message: `Your ${contentType} received ${vote.vote_type === 'up' ? 'an upvote' : 'a downvote'}`,
      data: { 
        voteId: vote.id,
        contentType,
        contentId: vote.question?.id || vote.answer?.id,
      },
      targetUserId,
      timestamp: new Date(),
    };

    this.sendNotificationToUser(targetUserId, notification);
  }

  onBountyAwarded(escrow: any) {
    const notification: NotificationPayload = {
      type: 'bounty_awarded',
      title: 'Bounty Received!',
      message: `You received $${escrow.amount} bounty for your answer`,
      data: { 
        escrowId: escrow.id,
        amount: escrow.amount,
        questionId: escrow.question?.id,
      },
      targetUserId: escrow.payee.id,
      timestamp: new Date(),
    };

    this.sendNotificationToUser(escrow.payee.id, notification);
  }

  private broadcastUserPresence(userId: string, status: string) {
    this.server.emit('user_presence_changed', {
      userId,
      status,
      timestamp: new Date(),
    });
  }

  // Utility methods
  getConnectedUserCount(): number {
    return this.connectedUsers.size;
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  getUserPresence(userId: string) {
    return this.userPresence.get(userId) || { 
      lastSeen: null, 
      status: 'offline' 
    };
  }

  getQuestionViewers(questionId: string): string[] {
    return Array.from(this.questionViewers.get(questionId) || []);
  }
}