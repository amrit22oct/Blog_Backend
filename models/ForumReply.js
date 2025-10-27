import mongoose from "mongoose";

const forumReplySchema = mongoose.Schema(
  {
    thread: { type: mongoose.Schema.Types.ObjectId, ref: "ForumThread", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("ForumReply", forumReplySchema);
