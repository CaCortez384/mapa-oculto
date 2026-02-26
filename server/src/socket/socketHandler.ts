import { Server } from "socket.io";
import { createServer } from "http";
import type { Express } from "express";

let io: Server;

export const setupSocket = (app: Express) => {
    const httpServer = createServer(app);

    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("🔌 Nuevo cliente conectado:", socket.id);
    });

    return httpServer;
};

export const getIO = () => {
    if (!io) throw new Error("Socket.io no inicializado");
    return io;
};
