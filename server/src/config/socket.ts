import { Server } from 'socket.io';
import { Server as HTTPServer } from 'node:http';
import { verifyToken } from './auth0';

let io: Server;

export const initializeSocket = (httpServer: HTTPServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env['NODE_ENV'] === 'production'
                ? process.env['CLIENT_URL_PROD']
                : process.env['CLIENT_URL_DEV'],
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    // Authentication middleware for Socket.IO
    io.use(async (socket, next) => {
        const token = socket.handshake.auth['token'];

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        try {
            const decoded = await verifyToken(token)
            socket.userId = decoded.sub;
            socket.userRole = decoded.role;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on("connection", (socket) => {
        console.log(`🔌 User connected: ${socket.id} (userId: ${socket.userId}, role: ${socket.userRole})`);

        // Join user to their personal room for targeted notifications
        const userRoom = `user:${socket.userId}`;
        socket.join(userRoom);
        console.log(`👤 User ${socket.userId} joined room: ${userRoom}`);

        // Join admin users to admin room
        if (socket.userRole === 'ADMIN') {
            socket.join('admins');
            console.log(`👑 Admin ${socket.userId} joined admins room`);
        }

        socket.on('disconnect', (reason) => {
            console.log(`User disconnected: ${socket.id} (reason: ${reason})`);
        });

        // Handle notification acknowledgment
        socket.on('notification:read', (notificationId) => {
            console.log(`Notification ${notificationId} marked as read by user ${socket.userId}`);
        });
    });

    return io;
};

// Export function to get the io instance
export const getSocketIO = (): Server => {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
};

// Notification event emitters
export const emitNotificationToUser = (userId: string, notification: any) => {
    if (io) {
        const userRoom = `user:${userId}`;
        const socketsInRoom = io.sockets.adapter.rooms.get(userRoom);
        console.log(`📤 Emitting notification to room: ${userRoom}`);
        console.log(`👥 Sockets in room: ${socketsInRoom ? socketsInRoom.size : 0}`);

        io.to(userRoom).emit('notification:new', notification);
        console.log(`✅ Notification sent to user ${userId}:`, notification.title);
    } else {
        console.error('❌ Socket.IO not initialized when trying to emit notification');
    }
};

export const emitNotificationToAdmins = (notification: any) => {
    if (io) {
        io.to('admins').emit('notification:new', notification);
        console.log('Notification sent to admins:', notification.title);
    }
};

export const emitNotificationUpdate = (userId: string, update: any) => {
    if (io) {
        io.to(`user:${userId}`).emit('notification:update', update);
    }
};

// Extend Socket interface to include custom properties
declare module 'socket.io' {
    interface Socket {
        userId?: string;
        userRole?: string;
    }
}