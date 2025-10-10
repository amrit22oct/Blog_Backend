import Article from "../models/Article.js";
import mongoose from "mongoose";
import Comment from "../models/CommentArticle.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// ---------------- Multer Setup ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadArticleImage = multer({ storage });

// ---------------- Controller Functions ----------------

// Create Article
export const createArticle = async (req, res) => {
  try {
    const data = { ...req.body, author: req.user._id };
    if (req.file) data.image = `/${req.file.path.replace("\\", "/")}`; // fix windows path

    const article = await Article.create(data);
    res.status(201).json(article);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get Articles
export const getArticles = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    if (category) query.category = category;

    const total = await Article.countDocuments(query);

    const articles = await Article.find(query)
      .populate("author", "name email")
      .populate("category", "name")
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      articles,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching articles:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get single Article by ID or slug
export const getArticleById = async (req, res) => {
  const { idOrSlug } = req.params;

  if (!idOrSlug) {
    return res.status(400).json({ message: "No id or slug provided" });
  }

  try {
    let article = null;

    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      article = await Article.findById(idOrSlug)
        .populate("author", "name email")
        .populate("category", "name");
    }

    if (!article) {
      article = await Article.findOne({ slug: idOrSlug })
        .populate("author", "name email")
        .populate("category", "name");
    }

    if (!article) return res.status(404).json({ message: "Article not found" });

    res.json(article);
  } catch (err) {
    console.error("Error fetching article:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update Article
export const updateArticle = async (req, res) => {
  const { idOrSlug } = req.params;

  let article = mongoose.Types.ObjectId.isValid(idOrSlug)
    ? await Article.findById(idOrSlug)
    : await Article.findOne({ slug: idOrSlug });

  if (!article) return res.status(404).json({ message: "Article not found" });

  if (
    article.author.toString() !== req.user._id.toString() &&
    req.user.role !== "superadmin"
  ) {
    return res.status(401).json({ message: "Not authorized" });
  }

  // Handle image update
  if (req.file) {
    article.image = `/${req.file.path.replace("\\", "/")}`;
  }

  Object.assign(article, req.body);
  await article.save();
  res.json(article);
};

// Delete Article
export const deleteArticle = async (req, res) => {
  const { idOrSlug } = req.params;
  let article = mongoose.Types.ObjectId.isValid(idOrSlug)
    ? await Article.findById(idOrSlug)
    : await Article.findOne({ slug: idOrSlug });

  if (!article) return res.status(404).json({ message: "Article not found" });

  if (
    article.author.toString() !== req.user._id.toString() &&
    req.user.role !== "superadmin"
  ) {
    return res.status(401).json({ message: "Not authorized" });
  }

  await article.deleteOne();
  res.json({ message: "Article removed" });
};

// Toggle Like
export const toggleLikeArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });

    const userId = req.user._id;
    const alreadyLiked = article.likes.includes(userId);

    if (alreadyLiked) {
      article.likes.pull(userId);
    } else {
      article.likes.push(userId);
    }

    await article.save();
    res.json({ likes: article.likes.length, liked: !alreadyLiked });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Add Comment
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment text is required" });

    const comment = await Comment.create({
      text,
      author: req.user._id,
      article: req.params.id,
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error adding comment:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get Comments
export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ article: req.params.id })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
