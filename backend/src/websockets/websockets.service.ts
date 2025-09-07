import { Injectable } from '@nestjs/common';
import { WebSocketsGateway, NotificationPayload, LiveActivityPayload } from './websockets.gateway';

@Injectable()
export class WebSocketsService {
  constructor(private webSocketsGateway: WebSocketsGateway) {}

  // Notification methods
  async sendUserNotification(userId: string, notification: Omit<NotificationPayload, 'timestamp'>) {
    const fullNotification: NotificationPayload = {
      ...notification,
      timestamp: new Date(),
    };
    
    this.webSocketsGateway.sendNotificationToUser(userId, fullNotification);
  }

  async sendGroupNotification(groupId: string, notification: Omit<NotificationPayload, 'timestamp'>) {
    const fullNotification: NotificationPayload = {
      ...notification,
      timestamp: new Date(),
    };
    
    this.webSocketsGateway.sendNotificationToGroup(groupId, fullNotification);
  }

  async broadcastNotification(notification: Omit<NotificationPayload, 'timestamp'>) {
    const fullNotification: NotificationPayload = {
      ...notification,
      timestamp: new Date(),
    };
    
    this.webSocketsGateway.broadcastGlobally('notification', fullNotification);
  }

  // Question lifecycle notifications
  async notifyQuestionCreated(question: any) {
    this.webSocketsGateway.onQuestionCreated(question);
    
    // Additional logic like sending emails, push notifications, etc.
  }

  async notifyAnswerCreated(answer: any) {
    this.webSocketsGateway.onAnswerCreated(answer);
  }

  async notifyAnswerAccepted(answer: any) {
    this.webSocketsGateway.onAnswerAccepted(answer);
  }

  async notifyVoteReceived(vote: any) {
    this.webSocketsGateway.onVoteReceived(vote);
  }

  async notifyBountyAwarded(escrow: any) {
    this.webSocketsGateway.onBountyAwarded(escrow);
  }

  // Expert routing notifications
  async notifyExpertRouting(questionId: string, expertIds: string[], routingReason: string) {
    const notification: Omit<NotificationPayload, 'timestamp'> = {
      type: 'expert_routed',
      title: 'Expert Match Found',
      message: `You've been matched to a question: ${routingReason}`,
      data: { questionId, routingReason },
    };

    for (const expertId of expertIds) {
      await this.sendUserNotification(expertId, {
        ...notification,
        targetUserId: expertId,
      });
    }
  }

  // Payment notifications
  async notifyPaymentReceived(userId: string, amount: number, currency: string, context: any) {
    await this.sendUserNotification(userId, {
      type: 'payment_received',
      title: 'Payment Received',
      message: `You received ${currency.toUpperCase()} ${amount}`,
      data: { amount, currency, ...context },
      targetUserId: userId,
    });
  }

  // Real-time activity broadcasting
  async broadcastQuestionActivity(questionId: string, activity: any) {
    this.webSocketsGateway.broadcastToQuestion(questionId, 'question_activity', {
      questionId,
      activity,
      timestamp: new Date(),
    });
  }

  async broadcastUserActivity(activity: LiveActivityPayload) {
    const fullActivity: LiveActivityPayload = {
      ...activity,
      timestamp: new Date(),
    };
    
    this.webSocketsGateway.broadcastGlobally('user_activity', fullActivity);
  }

  // Utility methods
  isUserOnline(userId: string): boolean {
    return this.webSocketsGateway.isUserOnline(userId);
  }

  getUserPresence(userId: string) {
    return this.webSocketsGateway.getUserPresence(userId);
  }

  getConnectedUserCount(): number {
    return this.webSocketsGateway.getConnectedUserCount();
  }

  getQuestionViewers(questionId: string): string[] {
    return this.webSocketsGateway.getQuestionViewers(questionId);
  }

  // Batch notifications
  async sendBulkNotifications(notifications: Array<{
    userId: string;
    notification: Omit<NotificationPayload, 'timestamp'>;
  }>) {
    for (const { userId, notification } of notifications) {
      await this.sendUserNotification(userId, notification);
    }
  }

  // System-wide announcements
  async broadcastSystemAnnouncement(title: string, message: string, data?: any) {
    await this.broadcastNotification({
      type: 'expert_routed', // Reusing type for system announcements
      title,
      message,
      data: { ...data, isSystemAnnouncement: true },
    });
  }

  // Maintenance notifications
  async broadcastMaintenanceNotice(message: string, scheduledTime?: Date) {
    await this.broadcastNotification({
      type: 'expert_routed', // Reusing type
      title: 'Maintenance Notice',
      message,
      data: { 
        isMaintenanceNotice: true,
        scheduledTime,
      },
    });
  }

  // Activity summaries
  async sendDailySummary(userId: string, summary: {
    questionsAsked: number;
    answersGiven: number;
    reputationGained: number;
    bountyEarned: number;
  }) {
    await this.sendUserNotification(userId, {
      type: 'expert_routed', // Reusing type
      title: 'Daily Summary',
      message: `Today: ${summary.questionsAsked} questions, ${summary.answersGiven} answers, +${summary.reputationGained} reputation`,
      data: { 
        ...summary,
        isDailySummary: true,
      },
      targetUserId: userId,
    });
  }
}