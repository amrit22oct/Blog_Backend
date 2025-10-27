import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import http from "http"; // ✅ Required for socket.io
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import formRoutes from "./routes/formRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import articleRoutes from "./routes/articleRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import forumRoutes from "./routes/forumRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import chatRoutes from "./routes/chatRoutes.js"; // ✅ You forgot this import
import { initSocket } from "./socket/socket.js"; // ✅ Socket.io config

// Load environment variables
dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve uploaded images
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ All API routes
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/threads", forumRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/chat", chatRoutes);

// ✅ Create HTTP server (required for Socket.io)
const server = http.createServer(app);

// ✅ Initialize Socket.io with the HTTP server
initSocket(server);
//  checking 

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
