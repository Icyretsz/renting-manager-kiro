import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketStore {
    socket: Socket | null;
    isConnected: boolean;
    isConnecting: boolean;
    connect: (token: string) => void;
    disconnect: () => void;
    // Auth0 integration methods
    initializeWithAuth: (getAccessTokenSilently: () => Promise<string>, isAuthenticated: boolean, user: any) => Promise<void>;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
    socket: null,
    isConnected: false,
    isConnecting: false,

    connect: (token: string) => {
        const { socket: currentSocket, isConnecting } = get();
        
        // Return early if already connected or connecting
        if (currentSocket?.connected) {
            console.log('Socket already connected');
            return;
        }
        
        if (isConnecting) {
            console.log('Socket connection already in progress');
            return;
        }

        // Clean up existing socket if disconnected
        if (currentSocket && !currentSocket.connected) {
            console.log('Cleaning up disconnected socket');
            currentSocket.disconnect();
            currentSocket.removeAllListeners();
        }

        const socketURL = import.meta.env.MODE === 'development' 
            ? import.meta.env.VITE_SOCKET_URL_DEV 
            : import.meta.env.VITE_SOCKET_URL_PROD;

        console.log('Creating new socket connection...');
        set({ isConnecting: true });

        const socket = io(socketURL, {
            auth: { token },
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            set({ isConnected: true, isConnecting: false });
            
            // Test connection
            socket.emit('ping', (response: string) => {
                console.log('Ping response:', response);
            });
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            set({ isConnected: false, isConnecting: false });
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            set({ isConnected: false, isConnecting: false });
        });

        set({ socket });
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) {
            console.log('Disconnecting socket');
            socket.disconnect();
            socket.removeAllListeners();
        }
        set({ socket: null, isConnected: false, isConnecting: false });
    },

    // Auth0 integration method
    initializeWithAuth: async (getAccessTokenSilently, isAuthenticated, user) => {
        if (!isAuthenticated || !user) {
            get().disconnect();
            return;
        }

        try {
            const token = await getAccessTokenSilently();
            if (token) {
                get().connect(token);
            }
        } catch (error) {
            console.error('Failed to get token for socket connection:', error);
            get().disconnect();
        }
    },
}));