import { useEffect } from 'react';
import { useSocketStore } from '@/stores/socketStore';
import { useAuth0 } from '@auth0/auth0-react';

export const useSocket = () => {
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();
  const { socket, isConnected, connect, disconnect } = useSocketStore();

  useEffect(() => {
    const connectSocket = async () => {
      if (!isAuthenticated || !user) {
        disconnect();
        return;
      }

      try {
        const token = await getAccessTokenSilently();
        if (token) {
          connect(token);
        }
      } catch (error) {
        console.error('Failed to get token for socket connection:', error);
        disconnect();
      }
    };

    connectSocket();

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user, getAccessTokenSilently, connect, disconnect]);

  return {
    socket,
    isConnected,
  };
};
