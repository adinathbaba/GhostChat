import { io } from "socket.io-client";

export const socket = io(
  "http://localhost:3000",
  "https://ghostchat-g6pu.onrender.com"
  {
    autoConnect: true,
  }
);
