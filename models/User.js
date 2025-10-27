import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dob: { type: Date },
    about: { type: String, maxlength: 200 },
    isActive: { type: Boolean, default: true },
    role: {
      type: String,
      enum: ["superadmin", "author", "user"], // allowed roles
      default: "user", // default role
    },

    // 🟢 Added call-related fields
    isOnline: { type: Boolean, default: false }, // track online status
    socketId: { type: String }, // store socket ID for real-time calls
    currentCall: {
      isInCall: { type: Boolean, default: false },
      callType: { type: String, enum: ["audio", "video"], default: null },
      withUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who they're in a call with
      startedAt: { type: Date },
    },
    lastCall: {
      callType: { type: String, enum: ["audio", "video"], default: null },
      callStatus: {
        type: String,
        enum: ["missed", "declined", "ended"],
        default: null,
      },
      duration: { type: Number }, // in seconds
      endedAt: { type: Date },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
