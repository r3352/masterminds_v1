"use client";

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/contexts/websocket-context';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Eye, Zap } from 'lucide-react';

interface LiveActivityProps {
  questionId?: string;
}

export function LiveActivity({ questionId }: LiveActivityProps) {
  const { socket, isConnected, onlineUsers } = useWebSocket();
  const [questionViewers, setQuestionViewers] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!socket || !questionId) return;

    // Join question room for live updates
    socket.emit('joinQuestionRoom', { questionId });

    // Listen for question viewers
    socket.on('questionViewers', (viewers: any[]) => {
      setQuestionViewers(viewers);
    });

    // Listen for typing indicators
    socket.on('userTyping', (data: any) => {
      setTypingUsers(prev => {
        const existing = prev.find(u => u.userId === data.userId);
        if (existing) return prev;
        return [...prev, data];
      });
    });

    socket.on('userStoppedTyping', (data: any) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    return () => {
      socket.emit('leaveQuestionRoom', { questionId });
      socket.off('questionViewers');
      socket.off('userTyping');
      socket.off('userStoppedTyping');
    };
  }, [socket, questionId]);

  if (!isConnected || !questionId) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-sm">Offline</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Live Activity</span>
          <Zap className="h-3 w-3" />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Online Users */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm">
            <Users className="h-4 w-4 text-green-500" />
            <span>{onlineUsers.length} users online</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            Global
          </Badge>
        </div>

        {/* Question Viewers */}
        {questionViewers.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 text-sm mb-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <span>{questionViewers.length} viewing this question</span>
            </div>
            <div className="flex items-center space-x-1">
              {questionViewers.slice(0, 5).map((viewer, index) => (
                <Avatar key={viewer.userId} className="h-6 w-6">
                  <AvatarImage src={viewer.avatar} />
                  <AvatarFallback className="text-xs">
                    {viewer.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {questionViewers.length > 5 && (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs">+{questionViewers.length - 5}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
            </div>
            <span>
              {typingUsers.length === 1 
                ? `${typingUsers[0].name} is typing...`
                : `${typingUsers.length} users are typing...`
              }
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}