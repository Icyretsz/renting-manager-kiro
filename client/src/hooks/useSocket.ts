import { useEffect } from 'react';
import { useSocketStore } from '@/stores/socketStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuth0 } from '@auth0/auth0-react';

export const useSocket = () => {
  const { isAuthenticated } = useAuth0();
  const { token } = useAuthStore();
  const { socket, isConnected, connect, disconnect } = useSocketStore();

  useEffect(() => {
    if (isAuthenticated && token) {
      connect(token);
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, connect, disconnect]);

  return {
    socket,
    isConnected,
  };
};