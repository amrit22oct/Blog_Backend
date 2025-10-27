// socket/socket.js
import { Server } from "socket.io";
import Chat from "../models/Chat.js"; // ✅ Import Chat model to populate users properly
import User from "../models/User.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    pingTimeout: 60000,
    cors: {
      origin: "*", // Change to your frontend URL in production
      methods: ["GET", "POST"],
    },
  });

  console.log("✅ Socket.io initialized");

  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    // ✅ User setup (join their own room)
    socket.on("setup", (userData) => {
      socket.join(userData._id);
      socket.emit("connected");
      console.log(`👤 User ${userData.name} joined room ${userData._id}`);
    });

    // ✅ Join a specific chat room
    socket.on("join chat", (roomId) => {
      socket.join(roomId);
      console.log(`🗨️ User joined chat room: ${roomId}`);
    });

    // ✅ Real-time message broadcast
    socket.on("new message", async (newMessage) => {
      try {
        // Populate chat with users so we can broadcast properly
        const chat = await Chat.findById(newMessage.chatId)
          .populate("users", "_id name")
          .lean();

        if (!chat?.users) {
          console.warn("⚠️ Chat has no users:", newMessage.chatId);
          return;
        }

        chat.users.forEach((user) => {
          // Skip the sender
          if (user._id.toString() === newMessage.senderId._id.toString()) return;

          io.to(user._id.toString()).emit("message received", newMessage);
        });

        console.log(`📨 Message broadcasted in chat ${chat._id}`);
      } catch (err) {
        console.error("❌ Error in new message socket event:", err);
      }
    });

    // ✅ Typing indicators
    socket.on("typing", (roomId) => {
      socket.in(roomId).emit("typing", roomId);
    });

    socket.on("stop typing", (roomId) => {
      socket.in(roomId).emit("stop typing", roomId);
    });

    // ✅ Call signaling (Audio / Video)
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

    // ✅ Disconnection
    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);
    });
  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};
