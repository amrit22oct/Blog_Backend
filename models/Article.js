import mongoose from "mongoose";
import slugify from "slugify";

const articleSchema = mongoose.Schema(
  {
    title: { type: String, required: true, minLength: 5, maxLength: 120 },
    content: { type: String, required: true, minLength: 20 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    tags: [{ type: String }],
    image: { type: String },
    published: { type: Boolean, default: false },
    slug: { type: String, unique: true },
    likes: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
  },
  { timestamps: true }
);

// Generate slug automatically
articleSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

// Article
articleSchema.index({ title: "text",  content: "text",  tags: "text" });



export default mongoose.model("Article", articleSchema);
