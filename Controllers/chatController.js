// controllers/chatController.js
import mongoose from "mongoose";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

/**
 * @desc Access or create a one-on-one chat between two users
 * @route POST /api/chat/
 * @access Private
 */
export const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId)
    return res.status(400).json({ message: "User ID not provided" });

  try {
    // Check if one-to-one chat exists
    let chat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [req.user._id, userId] },
    })
      .populate("users", "-password")
      .populate("latestMessage");

    if (chat) {
      chat = await User.populate(chat, {
        path: "latestMessage.senderId",
        select: "name email",
      });
      return res.status(200).json(chat);
    }

    // Otherwise create new chat
    const newChat = await Chat.create({
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    });

    const fullChat = await Chat.findById(newChat._id).populate("users", "-password");
    res.status(201).json(fullChat);
  } catch (error) {
    console.error("❌ Error in accessChat:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc Fetch all chats for the logged-in user
 * @route GET /api/chat/
 * @access Private
 */
export const fetchChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      users: { $elemMatch: { $eq: new mongoose.Types.ObjectId(req.user._id) } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate({
        path: "latestMessage",
        populate: { path: "senderId", select: "name email" },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    console.error("❌ Error in fetchChats:", error);
    res.status(500).json({ message: "Failed to fetch chats", error: error.message });
  }
};

/**
 * @desc Send a message (text/media/call)
 * @route POST /api/chat/message
 * @access Private
 */
export const sendMessage = async (req, res) => {
  const { chatId, content, type, mediaUrl, mediaType, callInfo } = req.body;

  if (!chatId)
    return res.status(400).json({ message: "Chat ID is required" });

  try {
    const newMessage = new Message({
      senderId: req.user._id,
      chatId,
      content: content || "",
      type: type || "text",
      mediaUrl,
      mediaType,
      callInfo,
    });

    const savedMessage = await newMessage.save();
    await Chat.findByIdAndUpdate(chatId, { latestMessage: savedMessage._id });

    const populatedMessage = await Message.findById(savedMessage._id)
      .populate("senderId", "name email")
      .populate({
        path: "chatId",
        populate: { path: "users", select: "name email" },
      });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("❌ Error in sendMessage:", error);
    res.status(500).json({ message: "Failed to send message", error: error.message });
  }
};

/**
 * @desc Fetch all messages in a chat
 * @route GET /api/chat/message/:chatId
 * @access Private
 */
export const fetchMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .populate("senderId", "name email")
      .populate("chatId")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ Error in fetchMessages:", error);
    res.status(500).json({ message: "Failed to fetch messages", error: error.message });
  }
};

/**
 * @desc Start a new call (audio/video)
 * @route POST /api/chat/call/start
 * @access Private
 */
export const startCall = async (req, res) => {
  const { chatId, callType, receiverId } = req.body;

  if (!chatId || !callType)
    return res.status(400).json({ message: "Chat ID and call type are required" });

  try {
    const callMessage = new Message({
      chatId,
      senderId: req.user._id,
      receiverId,
      type: "call",
      callInfo: {
        isCall: true,
        callType,
        callStatus: "started",
        startedAt: new Date(),
      },
    });

    const savedCall = await callMessage.save();
    await Chat.findByIdAndUpdate(chatId, { latestMessage: savedCall._id });

    const populatedCall = await Message.findById(savedCall._id)
      .populate("senderId", "name email")
      .populate("receiverId", "name email");

    res.status(201).json(populatedCall);
  } catch (error) {
    console.error("❌ Error in startCall:", error);
    res.status(500).json({ message: "Failed to start call", error: error.message });
  }
};

/*
 * @desc Update or end call (missed/declined/ended)
 * @route PUT /api/chat/call/update/:messageId
 * @access Private
 * */
export const updateCallStatus = async (req, res) => {
  const { callStatus, duration } = req.body;
  const { messageId } = req.params;

 try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Call not found" });

    message.callInfo.callStatus = callStatus || message.callInfo.callStatus;
    if (duration) message.callInfo.callDuration = duration;

    if (["missed", "declined", "ended"].includes(callStatus)) {
      message.callInfo.endedAt = new Date();
    }

    await message.save();

    const updatedCall = await Message.findById(messageId)
      .populate("senderId", "name email")
      .populate("receiverId", "name email");

    res.status(200).json(updatedCall);
  } catch (error) {
    console.error("❌ Error in updateCallStatus:", error);
    res.status(500).json({ message: "Failed to update call status", error: error.message });
  }
};
