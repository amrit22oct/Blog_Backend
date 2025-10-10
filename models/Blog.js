import mongoose from "mongoose";

const blogSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    summary: {type: String},
    tags: [{ type: String }],
    image: { type: String },
    published: { type: Boolean, default: true },
    likes: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
  },
  { timestamps: true }
);

// Blog
blogSchema.index({ title: "text", content: "text", summary: "text", tags: "text" });



export default mongoose.model("Blog", blogSchema);
