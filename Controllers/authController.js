import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import Article from "../models/Article.js";
import Blog from "../models/Blog.js";
import Forum from "../models/ForumThread.js";

import ForumReply from "../models/ForumReply.js";
import CommentBlog from "../models/CommentBlog.js";

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists, use another email" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "user", // default if not provided
      isActive: true,
    });

    await newUser.save();

    res
      .status(201)
      .json({ message: "User registered successfully, Redirecting to Login" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ====================== LOGIN ======================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("====================================");
    console.log("Login attempt for:", email);

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log("No user found with this email.");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if deactivated
    if (!user.isActive) {
      console.log("User is deactivated.");
      return res
        .status(403)
        .json({ message: "Account is deactivated, contact support." });
    }

    console.log("Stored password in DB:", user.password);

    let isMatch = false;

    // Case 1: Hashed password (new users)
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      isMatch = await bcrypt.compare(password, user.password);
      console.log("Checked with bcrypt ->", isMatch);
    } else {
      // Case 2: Plain text password (old users)
      isMatch = password === user.password;
      console.log("Checked as plain text ->", isMatch);

      if (isMatch) {
        //  Migrate to bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();
        console.log("Password was plain text. Migrated to hash.");
      }
    }

    if (!isMatch) {
      console.log("Final result -> Invalid credentials");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing in .env file!");
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, // include role in JWT
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("Login successful for:", email);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role, // ✅ return role
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


// Deactivate user and  deleate their posts and the comments

export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Deactivate attempt for userId:", id);

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      console.log("No user found with this id:", id);
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deactivated successfully", user });
  } catch (error) {
    console.error("Deactivate error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Deleting the user and theri posts form the modal

export const deleateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    //deleting user's related content
    await Article.deleteMany({ author: userId });
    await Blog.deleteMany({ author: userId });
    await Forum.deleteMany({ author: userId });

    // Deleate the user
    const user = await user.findByIdAnddelete(userId);
    if (!user) return res.status(400).json({ message: "User not found" });

    res
      .status(200)
      .json({ message: "user and all related content deleated succesfully" });
  } catch (error) {
    console.error("Deleate user error", error);
    res.status(500).json({ message: " Server error", error });
  }
};

//Reactivate the user

export const reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Reactivate attempt for userId:", id);

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      console.log("No user found with id:", id);
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User reactivated successfully", user });
  } catch (error) {
    console.error("Reactivate error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getMyDetails = async (req, res) => {
  try {
    const userId = req.user._id; // from authMiddleware
    const role = req.user.role;

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    let articles, blogs, forumThreads;

    if (role === "superadmin") {
      // 🔑 fetch all content across all users
      articles = await Article.find().populate("author", "name email role");
      blogs = await Blog.find().populate("author", "name email role");
      forumThreads = await Forum.find().populate("author", "name email role");
    } else {
      // 🔑 fetch only the current user’s authored content
      articles = await Article.find({ author: userId });
      blogs = await Blog.find({ author: userId });
      forumThreads = await Forum.find({ author: userId });
    }

    // Fetch interactions (only for the logged-in user, this part stays the same)
    const blogComments = await CommentBlog.find({ author: userId }).populate(
      "blog",
      "title"
    );
    const forumReplies = await ForumReply.find({ author: userId }).populate(
      "thread",
      "title"
    );

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
    console.error("Error in getMyDetails:", err);
    res.status(500).json({ error: "Server error" });
  }
};
