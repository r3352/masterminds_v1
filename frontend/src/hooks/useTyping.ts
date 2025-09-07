import { useEffect, useRef } from 'react';
import { useWebSocket } from '@/contexts/websocket-context';
import { useAuth } from '@/contexts/auth-context';

interface UseTypingOptions {
  questionId?: string;
  delay?: number;
}

export function useTyping({ questionId, delay = 1000 }: UseTypingOptions) {
  const { socket } = useWebSocket();
  const { user } = useAuth();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const startTyping = () => {
    if (!socket || !questionId || !user) return;

    if (!isTypingRef.current) {
      socket.emit('startTyping', {
        questionId,
        userId: user.id,
        name: user.full_name || user.username,
      });
      isTypingRef.current = true;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, delay);
  };

  const stopTyping = () => {
    if (!socket || !questionId || !user || !isTypingRef.current) return;

    socket.emit('stopTyping', {
      questionId,
      userId: user.id,
    });
    isTypingRef.current = false;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        stopTyping();
      }
    };
  }, []);

  return { startTyping, stopTyping };
}