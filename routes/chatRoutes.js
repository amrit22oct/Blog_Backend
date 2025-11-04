// routes/chatRoutes.js
import express from "express";
import {
  accessChat,
  fetchChats,
  sendMessage,
  fetchMessages,
  startCall,
  updateCallStatus,
  replyMessage,
  fetchGroupChats,
  createGroupChat,
} from "../Controllers/chatController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.route("/").post(authMiddleware, accessChat).get(authMiddleware, fetchChats);
router.route("/message").post(authMiddleware, sendMessage);
router.route("/message/:chatId").get(authMiddleware, fetchMessages);

// ✅ Reply message route
router.post("/message/reply", authMiddleware, replyMessage);

// 🟢 Call endpoints
router.route("/call/start").post(authMiddleware, startCall);
router.route("/call/update/:messageId").put(authMiddleware, updateCallStatus);

router.post("/group", authMiddleware, createGroupChat);
router.get("/group", authMiddleware, fetchGroupChats);

router.get("/protected", authMiddleware, (req, res) => {
   res.status(200).json({
     message: "✅ Protected route accessed successfully!",
     user: req.user,
   });
 });



export default router;
