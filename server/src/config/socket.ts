import { Server } from 'socket.io';
import { Server as HTTPServer } from 'node:http';

export const initializeSocket = (httpServer: HTTPServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log('user connected: ', socket.id)
    });

    return io;
};