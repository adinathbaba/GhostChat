import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();

// ✅ NEW: reverse map for O(1) lookup (code -> socketId)
const codeToSocket = new Map<string, string>();

// ✅ FIXED: now uses the reverse map instead of looping
function findSocketByCode(code: string): string | null {
  return codeToSocket.get(code) || null;
}

// ✅ NEW: helper to fully clean up a room and notify both users
function cleanupRoom(io: Server, roomId: string) {
  const room = roomPartners.get(roomId);
  if (!room) return;

  const { user1, user2 } = room;

  // Get the socket objects
  const socket1 = io.sockets.sockets.get(user1);
  const socket2 = io.sockets.sockets.get(user2);

  // Notify both partners directly (before removing anything)
  if (socket1) {
    socket1.emit("partner-left", "Room closed");
    socket1.leave(roomId);
  }
  if (socket2) {
    socket2.emit("partner-left", "Room closed");
    socket2.leave(roomId);
  }

  // Delete the room from the map
  roomPartners.delete(roomId);

  console.log(`✅ Room ${roomId} cleaned up and partners notified.`);
}

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://ghost-chat-murex.vercel.app"
  ]
}));
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://ghost-chat-murex.vercel.app"
    ]
  },
  maxHttpBufferSize: 10 * 1024 * 1024
});

const PORT = 3000;
const waitingQueue: string[] = [];
const roomPartners = new Map<string, { user1: string; user2: string }>();
const userCodes = new Map<string, string>();
const blockedUsers = new Map<string, string[]>();
const requestCooldowns = new Map<string, number>();

app.get("/", (req, res) => {
  res.send("Backend running");
});

io.on("connection", (socket) => {

  socket.on("typing", (roomId) => {
    socket.to(roomId).emit("typing");
  });

  socket.on("send-request", (receiverCode) => {

    const now = Date.now();
    const lastRequest = requestCooldowns.get(socket.id) || 0;

    if (now - lastRequest < 5000) {
      socket.emit("request-error", "⏳ Wait 5 seconds before sending again");
      return;
    }

    requestCooldowns.set(socket.id, now);

    const senderCode = userCodes.get(socket.id);
    const targetSocketId = findSocketByCode(receiverCode);

    if (!senderCode || !targetSocketId) {
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

    io.to(targetSocketId).emit("chat-request", { senderCode });
    socket.emit("request-pending");
  });

  socket.on("request-response", ({ senderCode, response }) => {

    const senderSocket = findSocketByCode(senderCode);
    if (!senderSocket) return;

    if (response === "yes") {

      const roomId = `private_${Date.now()}`;
      const receiverCode = userCodes.get(socket.id);

      io.sockets.sockets.get(senderSocket)?.join(roomId);
      socket.join(roomId);

      roomPartners.set(roomId, {
        user1: senderSocket,
        user2: socket.id,
      });

      io.to(senderSocket).emit("request-accepted", {
        roomId,
        partnerCode: receiverCode,
      });

      io.to(socket.id).emit("request-accepted", {
        roomId,
        partnerCode: senderCode,
      });

      console.log("Private match created:", roomId, senderCode, receiverCode);

    } else if (response === "no") {

      io.to(senderSocket).emit("request-rejected");

    } else if (response === "block") {

      const receiverCode = userCodes.get(socket.id);

      if (receiverCode) {
        const existing = blockedUsers.get(receiverCode) || [];
        blockedUsers.set(receiverCode, [...existing, senderCode]);
      }

      io.to(senderSocket).emit("request-blocked");
    }
  });

  socket.on("register-code", (code) => {
    userCodes.set(socket.id, code);
    codeToSocket.set(code, socket.id); // ✅ keep reverse map in sync
    console.log("Code registered:", code);
  });

  console.log("User connected:", socket.id);

  // ✅ FIXED: socket.to() (not io.to()) + acknowledgment callback
  socket.on("send-message", ({ roomId, message }, callback) => {
    socket.to(roomId).emit("receive-message", message);

    if (typeof callback === "function") {
      callback({ success: true, deliveredAt: Date.now() });
    }
  });

  // ✅ FIXED: fully clean up the room
  socket.on("leave-chat", (roomId) => {
    cleanupRoom(io, roomId);
  });

  socket.emit("welcome", "Connected to GhostChat server");

  socket.on("join-random", () => {

    console.log(socket.id, "requested random chat");

    if (waitingQueue.includes(socket.id)) {
      return;
    }

    if (waitingQueue.length > 0) {

      const partnerId = waitingQueue.shift();
      if (!partnerId) return;

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

    } else {

      waitingQueue.push(socket.id);
      console.log(socket.id, "added to queue");
      socket.emit("waiting");
    }
  });

  socket.on("disconnect", () => {

    // ✅ FIXED: notify partner + delete room
    for (const [roomId, users] of roomPartners.entries()) {
      if (users.user1 === socket.id || users.user2 === socket.id) {
        cleanupRoom(io, roomId);
        break; // a user is only in one room at a time
      }
    }

    // ✅ Clean up reverse map + userCodes
    const userCode = userCodes.get(socket.id);
    if (userCode) {
      codeToSocket.delete(userCode);
      userCodes.delete(socket.id);
    }

    // ✅ Remove from waiting queue
    const index = waitingQueue.indexOf(socket.id);
    if (index !== -1) {
      waitingQueue.splice(index, 1);
    }

    // ✅ Clean up cooldowns
    requestCooldowns.delete(socket.id);

    console.log("User disconnected:", socket.id);
  });

  socket.on("leave-queue", () => {
  const index = waitingQueue.indexOf(socket.id);
  if (index !== -1) {
    waitingQueue.splice(index, 1);
    socket.emit("queue-left");
    console.log(`User ${socket.id} left the queue`);
  }
});


});

httpServer.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});