import mongoose from "mongoose";

const forumThreadSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    locked: { type: Boolean, default: false }
  },
  { timestamps: true }
);



// ForumThread
forumThreadSchema.index({ title: "text", content: "text",  });


export default mongoose.model("ForumThread", forumThreadSchema);
