import { Server } from "socket.io";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

let io;

export const initSocket = (server, app) => {
  try {
    io = new Server(server, {
      cors: {
        origin: "*", // ⚠️ Update to your frontend URL in production
        methods: ["GET", "POST"],
      },
      pingTimeout: 60000,
    });

    app.set("io", io);
    console.log("✅ Socket.io initialized successfully");

    // ===================================================
    // ⚡ Active Socket Map (userId -> socketId)
    // ===================================================
    const onlineUsers = new Map();

    io.on("connection", (socket) => {
      console.log(`🟢 New socket connected: ${socket.id}`);

      /** Helper: safer socket event wrapper */
      const safeOn = (event, handler) => {
        socket.on(event, async (...args) => {
          try {
            await handler(...args);
          } catch (err) {
            console.error(`❌ Error in '${event}':`, err);
            socket.emit("error", { event, message: err.message });
          }
        });
      };

     // ===================================================
// 👤 SETUP (join personal room)
// ===================================================
safeOn("setup", async (userData) => {
  if (!userData?._id) return;
  const userId = userData._id.toString();

  // ✅ Store the userId on the socket for reference
  socket.userId = userId;
  socket.join(userId);
  onlineUsers.set(userId, socket.id);
  socket.emit("connected");

  console.log(`👤 ${userData.name || "User"} joined personal room ${userId}`);

  io.emit("online users", Array.from(onlineUsers.keys()));

  // 📩 Optionally deliver missed messages
  const missed = await Message.find({
    "chat.users": userId,
    deliveredTo: { $ne: userId },
  }).populate("chat");

  if (missed.length > 0) {
    missed.forEach((m) => socket.emit("message received", m));
  }
});

// ===================================================
// 💬 JOIN CHAT ROOM (Fixed version)
// ===================================================
safeOn("join chat", (roomId) => {
  if (!roomId) return;

  // ✅ Leave all other chat rooms except the user's personal room and socket.id
  for (const room of socket.rooms) {
    if (room !== socket.id && room !== socket.userId && room !== roomId.toString()) {
      socket.leave(room);
    }
  }

  socket.join(roomId.toString());
  console.log(`💬 ${socket.id} joined chat ${roomId}`);
});


      // ===================================================
      // 🚪 LEAVE CHAT ROOM
      // ===================================================
      safeOn("leave chat", (roomId) => {
        if (!roomId) return;
        socket.leave(roomId.toString());
        console.log(`🚪 ${socket.id} left chat ${roomId}`);
      });

      // ===================================================
      // 📨 NEW MESSAGE HANDLER
      // ===================================================
      // ===================================================
// 📨 NEW MESSAGE HANDLER — FIXED
// ===================================================
safeOn("new message", async (newMessage) => {
  if (!newMessage) return;

  const chat = newMessage.chat;
  const chatId = chat?._id || newMessage.chatId;
  if (!chatId) return console.warn("⚠️ Missing chatId in message payload");

  console.log(`📤 New message in chat ${chatId}`);

  // Ensure chat.users is available
  let users = chat?.users;
  if (!users || users.length === 0) {
    const chatDoc = await Chat.findById(chatId).populate("users", "_id name");
    users = chatDoc?.users || [];
  }

  // ✅ Broadcast message only to that chat room
  io.to(chatId.toString()).emit("message received", newMessage);

  // ✅ Send a lightweight "notification" to other users' personal rooms
  const senderId =
    newMessage.senderId?._id?.toString?.() ||
    newMessage.senderId?.toString?.();

  for (const user of users) {
    const userId = user?._id?.toString?.() || user?.toString?.();
    if (!userId || userId === senderId) continue;

    // 🔔 Notify the user (they may or may not have the chat open)
    io.to(userId).emit("notification", {
      chatId,
      message: newMessage,
    });

    // 💤 Mark delivered or undelivered
    const targetSocket = io.sockets.adapter.rooms.get(userId);
    if (targetSocket) {
      await Message.findByIdAndUpdate(newMessage._id, {
        $addToSet: { deliveredTo: userId },
      });
    } else {
      await Message.findByIdAndUpdate(newMessage._id, {
        $addToSet: { undeliveredTo: userId },
      });
    }
  }
});



      // ===================================================
      // 🔴 DISCONNECT HANDLER
      // ===================================================
      socket.on("disconnect", () => {
        for (const [userId, sId] of onlineUsers.entries()) {
          if (sId === socket.id) {
            onlineUsers.delete(userId);
            console.log(`🔴 User ${userId} went offline`);
            break;
          }
        }
        io.emit("online users", Array.from(onlineUsers.keys()));
      });

      socket.on("error", (err) => {
        console.error(`⚠️ Socket error from ${socket.id}:`, err.message);
      });
    });

    // ===================================================
    // 🚨 CONNECTION ERRORS
    // ===================================================
    io.engine.on("connection_error", (err) => {
      console.error("🚨 Socket.io connection error:", err.message);
    });

  } catch (err) {
    console.error("❌ Failed to initialize Socket.io:", err.message);
  }
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized yet!");
  return io;
};
