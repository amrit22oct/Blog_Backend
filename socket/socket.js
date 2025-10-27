// socket/socket.js
import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    pingTimeout: 60000,
    cors: {
      origin: "*", // Change this to your frontend origin for security, e.g. "http://localhost:3000"
    },
  });

  console.log("✅ Socket.io initialized");

  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    // 🔹 When user joins with their ID
    socket.on("setup", (userData) => {
      socket.join(userData._id);
      socket.emit("connected");
      console.log(`👤 User ${userData.name} joined room ${userData._id}`);
    });

    // 🔹 Join a specific chat room
    socket.on("join chat", (room) => {
      socket.join(room);
      console.log(`🗨️ User joined chat: ${room}`);
    });

    // 🔹 Send & receive messages in real-time
    socket.on("new message", (newMessage) => {
      const chat = newMessage.chatId;
      if (!chat?.users) return;

      chat.users.forEach((user) => {
        if (user._id.toString() === newMessage.senderId._id.toString()) return;
        socket.in(user._id).emit("message received", newMessage);
      });
    });

    // 🔹 Handle typing indicators
    socket.on("typing", (room) => socket.in(room).emit("typing", room));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing", room));

    // 🔹 CALL EVENTS (Audio / Video)
    socket.on("call user", (data) => {
      console.log(`📞 Calling user ${data.to}`);
      io.to(data.to).emit("incoming call", {
        from: data.from,
        callType: data.callType,
        roomId: data.roomId,
      });
    });

    socket.on("answer call", (data) => {
      console.log(`✅ Call answered by ${data.to}`);
      io.to(data.to).emit("call accepted", data);
    });

    socket.on("end call", (data) => {
      console.log(`❌ Call ended between ${data.from} and ${data.to}`);
      io.to(data.to).emit("call ended", data);
    });

    socket.on("decline call", (data) => {
      console.log(`🚫 Call declined by ${data.to}`);
      io.to(data.to).emit("call declined", data);
    });

    // 🔹 Handle disconnection
    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);
    });
  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};
