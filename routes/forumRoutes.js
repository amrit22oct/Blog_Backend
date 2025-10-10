import express from "express";
import { createThread, getThreads, getThreadById, deleteThread, addReply, updateThread } from "../Controllers/forumController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Threads
router.route("/")
  .get(getThreads)
  .post(authMiddleware, createThread);

router.route("/:id")
  .get(getThreadById)
  .put(authMiddleware,updateThread)
  .delete(authMiddleware, deleteThread);

// Replies
router.post("/:threadId/replies", authMiddleware, addReply);

export default router;
