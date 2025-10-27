import express from "express";
import {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  upload,
  toggleLikeBlog,
  addComment,
  getComments
} from "../Controllers/blogController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router
  .route("/")
  .get(getBlogs)
  .post(authMiddleware, upload.single("image"), createBlog);

router.post("/:id/like", authMiddleware, toggleLikeBlog);

router.post("/:id/comments", authMiddleware, addComment);
router.get("/:id/comments", getComments);

router
  .route("/:id")
  .get(getBlogById)
  .put(authMiddleware, upload.single("image"), updateBlog) // ✅ add Multer
  .delete(authMiddleware, deleteBlog);

export default router;
