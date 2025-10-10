// controllers/superAdminController.js
import User from "../models/User.js";
import Article from "../models/Article.js";
import Blog from "../models/Blog.js";
import ForumThread from "../models/ForumThread.js";
import ForumReply from "../models/ForumReply.js";
import CommentBlog from "../models/CommentBlog.js";



// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single user + all related content
export const getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Fetch all content authored by this user
    const articles = await Article.find({ author: userId });
    const blogs = await Blog.find({ author: userId });
    const forumThreads = await ForumThread.find({ author: userId });

    // Fetch user’s interactions
    const blogComments = await CommentBlog.find({ author: userId }).populate("blog", "title");
    const forumReplies = await ForumReply.find({ author: userId }).populate("thread", "title");

    res.json({
      success: true,
      user,
      content: {
        articles,
        blogs,
        forumThreads,
      },
      interactions: {
        blogComments,
        forumReplies,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ success: true, message: "Role updated", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user (status, profile, etc.)
export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ success: true, message: "User updated", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete user and optionally their data
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Delete related content
    await Article.deleteMany({ author: userId });
    await Blog.deleteMany({ author: userId });
    await ForumThread.deleteMany({ author: userId });
    await ForumReply.deleteMany({ author: userId });
    await CommentBlog.deleteMany({ author: userId });

    res.json({ success: true, message: "User and all related data deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getAllBlogs = async (req,res) => {
  try {
    const blogs = await Blog.find().populate("author","name email role");
    res.json(blogs);
  } catch (error) {
    res.status(500).json({message:"failed to fetch the blogs"});
    
  }
};

export const getAllForumThreads = async(req,res) => {
 try {
  const threads = await ForumThread.find().populate("author","name email role");
  res.json(threads);
 } catch (error) {
  console.error({error: error.message});
  res.status(500).json({message: "Faild to fetch the threads"});
  
 }
}

export const getAllArticles = async(req,res) => {
  try {
    const articles = await Article.find().populate("author","name email role");
    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({message: " failed to fetch the articles"});
  }
};

