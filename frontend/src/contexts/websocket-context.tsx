"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export interface Notification {
  id: string;
  type: 'question_answered' | 'answer_accepted' | 'payment_received' | 'new_question' | 'expert_routed';
  title: string;
  message: string;
  data?: any;
  createdAt: Date;
  read: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3005', {
      auth: {
        token: localStorage.getItem('accessToken'),
        userId: user.id,
      },
      transports: ['websocket'],
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    // User presence events
    socketInstance.on('userOnline', (users: string[]) => {
      setOnlineUsers(users);
    });

    socketInstance.on('userOffline', (users: string[]) => {
      setOnlineUsers(users);
    });

    // Question events
    socketInstance.on('questionAnswered', (data: any) => {
      addNotification({
        id: Date.now().toString(),
        type: 'question_answered',
        title: 'New Answer',
        message: `Your question "${data.question.title}" received a new answer`,
        data,
        createdAt: new Date(),
        read: false,
      });
    });

    socketInstance.on('answerAccepted', (data: any) => {
      addNotification({
        id: Date.now().toString(),
        type: 'answer_accepted',
        title: 'Answer Accepted',
        message: `Your answer was accepted for "${data.question.title}"`,
        data,
        createdAt: new Date(),
        read: false,
      });
    });

    // Payment events
    socketInstance.on('paymentReceived', (data: any) => {
      addNotification({
        id: Date.now().toString(),
        type: 'payment_received',
        title: 'Payment Received',
        message: `You received $${data.amount} for your answer`,
        data,
        createdAt: new Date(),
        read: false,
      });
    });

    // Expert routing events
    socketInstance.on('expertRouted', (data: any) => {
      addNotification({
        id: Date.now().toString(),
        type: 'expert_routed',
        title: 'Question Match',
        message: `A question matching your expertise was posted: "${data.question.title}"`,
        data,
        createdAt: new Date(),
        read: false,
      });
    });

    // New question events
    socketInstance.on('newQuestion', (data: any) => {
      addNotification({
        id: Date.now().toString(),
        type: 'new_question',
        title: 'New Question',
        message: `New question in ${data.question.group?.name || 'General'}: "${data.question.title}"`,
        data,
        createdAt: new Date(),
        read: false,
      });
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user, isAuthenticated]);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50 notifications
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value: WebSocketContextType = {
    socket,
    isConnected,
    onlineUsers,
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};