import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    // 🔹 Basic message info
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat", // link to chat room (1-on-1 or group)
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // optional for group chats
    },

    // 🔹 Message type: text, image, video, audio, file, or call event
    type: {
      type: String,
      enum: ["text", "image", "video", "audio", "file", "call"],
      default: "text",
    },

    // 🔹 Message content (for text or file URL)
    content: {
      type: String,
      trim: true,
    },

    // 🔹 Media metadata
    mediaUrl: { type: String },
    mediaType: { type: String }, // e.g. "image/png", "audio/mp3"
    mediaDuration: { type: Number }, // seconds

    // 🔹 Call info (for voice/video call events)
    callInfo: {
      isCall: { type: Boolean, default: false },
      callType: { type: String, enum: ["audio", "video"], default: null },
      callStatus: {
        type: String,
        enum: ["started", "missed", "declined", "ended"],
        default: null,
      },
      callDuration: { type: Number }, // in seconds
      startedAt: { type: Date },
      endedAt: { type: Date },
    },

    // 🔹 Message status (for delivery/read receipts)
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },

    // 🔹 Optional extra data
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// ✅ Capitalize model name (Mongoose convention)
const Message = mongoose.model("Message", messageSchema);

export default Message;
