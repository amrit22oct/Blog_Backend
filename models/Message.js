import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    // 🔹 Chat & user info
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
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
      required: false,
    },

    // 🔹 Type & content
    type: {
      type: String,
      enum: ["text", "image", "video", "audio", "file", "call"],
      default: "text",
    },
    content: {
      type: String,
      trim: true,
    },

    // 🔹 Media details
    mediaUrl: { type: String },
    mediaType: { type: String },
    mediaDuration: { type: Number },

    // 🔹 Call info
    callInfo: {
      isCall: { type: Boolean, default: false },
      callType: { type: String, enum: ["audio", "video"], default: null },
      callStatus: {
        type: String,
        enum: ["started", "missed", "declined", "ended"],
        default: null,
      },
      callDuration: { type: Number },
      startedAt: { type: Date },
      endedAt: { type: Date },
    },

    // 🔹 Message status
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },

    // 🔹 Optional reply reference (💬 reply to another message)
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // 🔹 Metadata
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
