import express from "express";
import {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  toggleLikeArticle,
  addComment,
  getComments,
  uploadArticleImage
} from "../Controllers/articleController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router
  .route("/")
  .get(getArticles)
  .post(authMiddleware, uploadArticleImage.single("image"), createArticle);

router.post("/:id/like", authMiddleware, toggleLikeArticle);
router.post("/:id/comments", authMiddleware, addComment);
router.get("/:id/comments", getComments);

router
  .route("/:idOrSlug")
  .get(getArticleById)
  .put(authMiddleware, uploadArticleImage.single("image"), updateArticle)
  .delete(authMiddleware, deleteArticle);

export default router;
