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
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
