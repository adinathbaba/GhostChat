"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
function findSocketByCode(code) {
    for (const [socketId, userCode] of userCodes) {
        if (userCode === code) {
            return socketId;
        }
    }
    return null;
}
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin:  [
    "http://localhost:5173",
    "https://ghost-chat-murex.vercel.app"
  ],
        methods: ["GET", "POST"],
    },
});
const PORT = 3000;
const waitingQueue = [];
const roomPartners = new Map();
const userCodes = new Map();
const blockedUsers = new Map();
const requestCooldowns = new Map();
app.get("/", (req, res) => {
    res.send("Backend running");
});
io.on("connection", (socket) => {
    socket.on("send-request", (receiverCode) => {
        // ✅ Cooldown check
        const now = Date.now();
        const lastRequest = requestCooldowns.get(socket.id) || 0;
        if (now - lastRequest < 5000) {
            socket.emit("request-error", "⏳ Wait 5 seconds before sending again");
            return;
        }
        requestCooldowns.set(socket.id, now);
        const senderCode = userCodes.get(socket.id);
        const targetSocketId = findSocketByCode(receiverCode);
        if (!senderCode ||
            !targetSocketId) {
            socket.emit("request-error", "User not found");
            return;
        }
        if (targetSocketId === socket.id) {
            socket.emit("request-error", "🚫 Cannot request yourself");
            return;
        }
        const blocked = blockedUsers.get(receiverCode) || [];
        if (blocked.includes(senderCode)) {
            socket.emit("request-blocked");
            return;
        }
        console.log(senderCode, "sent request to", receiverCode);
        io.to(targetSocketId).emit("chat-request", {
            senderCode,
        });
        socket.emit("request-pending");
    });
    socket.on("request-response", ({ senderCode, response, }) => {
        const senderSocket = findSocketByCode(senderCode);
        if (!senderSocket)
            return;
        if (response ===
            "yes") {
            const roomId = `private_${Date.now()}`;
            const receiverCode = userCodes.get(socket.id);
            // join BOTH users to room
            io.sockets.sockets
                .get(senderSocket)
                ?.join(roomId);
            socket.join(roomId);
            // save room
            roomPartners.set(roomId, {
                user1: senderSocket,
                user2: socket.id,
            });
            // send acceptance
            io.to(senderSocket).emit("request-accepted", {
                roomId,
                partnerCode: receiverCode,
            });
            io.to(socket.id).emit("request-accepted", {
                roomId,
                partnerCode: senderCode,
            });
            console.log("Private match created:", roomId, senderCode, receiverCode);
        }
        else if (response ===
            "no") {
            io.to(senderSocket).emit("request-rejected");
        }
        else if (response ===
            "block") {
            const receiverCode = userCodes.get(socket.id);
            if (receiverCode) {
                const existing = blockedUsers.get(receiverCode) || [];
                blockedUsers.set(receiverCode, [
                    ...existing,
                    senderCode,
                ]);
            }
            io.to(senderSocket).emit("request-blocked");
        }
    });
    socket.on("register-code", (code) => {
        userCodes.set(socket.id, code);
        console.log("Code registered:", code);
    });
    console.log("User connected:", socket.id);
    socket.on("send-message", ({ roomId, message, }) => {
        io.to(roomId).emit("receive-message", message);
    });
    socket.on("leave-chat", (roomId) => {
        socket.leave(roomId);
        socket.to(roomId).emit("partner-left");
    });
    socket.emit("welcome", "Connected to GhostChat server");
    socket.on("join-random", () => {
        console.log(socket.id, "requested random chat");
        if (waitingQueue.includes(socket.id)) {
            return;
        }
        if (waitingQueue.length > 0) {
            const partnerId = waitingQueue.shift();
            if (!partnerId)
                return;
            const roomId = `room_${Date.now()}`;
            roomPartners.set(roomId, {
                user1: socket.id,
                user2: partnerId,
            });
            socket.join(roomId);
            const partnerSocket = io.sockets.sockets.get(partnerId);
            partnerSocket?.join(roomId);
            const user1Code = userCodes.get(partnerId);
            const user2Code = userCodes.get(socket.id);
            io.to(partnerId).emit("matched", {
                roomId,
                partnerCode: user2Code,
            });
            io.to(socket.id).emit("matched", {
                roomId,
                partnerCode: user1Code,
            });
            console.log("Matched", socket.id, partnerId, roomId);
        }
        else {
            waitingQueue.push(socket.id);
            console.log(socket.id, "added to queue");
            socket.emit("waiting");
        }
    });
    socket.on("disconnect", () => {
        userCodes.delete(socket.id);
        const index = waitingQueue.indexOf(socket.id);
        for (const [roomId, users] of roomPartners) {
            if (users.user1 === socket.id ||
                users.user2 === socket.id) {
                roomPartners.delete(roomId);
            }
        }
        if (index !== -1) {
            waitingQueue.splice(index, 1);
        }
        // ✅ Cleanup cooldowns
        requestCooldowns.delete(socket.id);
        // ✅ Cleanup user codes
        userCodes.delete(socket.id);
        console.log("User disconnected:", socket.id);
        console.log("User disconnected:", socket.id);
    });
});
httpServer.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
