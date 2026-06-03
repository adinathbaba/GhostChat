import { io } from "socket.io-client";

export const socket = io(
  "https://ghostchat-g6pu.onrender.com"
  {
    autoConnect: true,
  }
);
