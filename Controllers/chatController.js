// controllers/chatController.js
import mongoose from "mongoose";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

export const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId)
    return res.status(400).json({ message: "User ID not provided" });

  try {
    // 🔹 Check for existing one-on-one chat
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

    // 🔹 Otherwise create a new one-on-one chat
    const newChat = await Chat.create({
      chatName: "",
      isGroupChat: false,
      users: [req.user._id, userId],
    });

    const fullChat = await Chat.findById(newChat._id)
      .populate("users", "-password")
      .populate("latestMessage");

    res.status(201).json(fullChat);
  } catch (error) {
    console.error("❌ Error in accessChat:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ✅ Fetch all chats (private + group)
// ✅ Fetch all chats (private + group)
export const fetchChats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const chats = await Chat.find({
      users: { $elemMatch: { $eq: userId } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate({
        path: "latestMessage",
        populate: {
          path: "senderId",
          select: "name email",
        },
      })
      .sort({ updatedAt: -1 });

    // 🔹 Optional: if any chat doesn’t have a populated latestMessage (due to stale reference)
    // try to fetch the most recent message manually
    const fixedChats = await Promise.all(
      chats.map(async (chat) => {
        if (!chat.latestMessage) {
          const recentMessage = await Message.findOne({ chatId: chat._id })
            .sort({ createdAt: -1 })
            .populate("senderId", "name email");
          chat.latestMessage = recentMessage || null;
        }
        return chat;
      })
    );

    res.status(200).json(fixedChats);
  } catch (error) {
    console.error("❌ Error in fetchChats:", error);
    res.status(500).json({
      message: "Failed to fetch chats",
      error: error.message,
    });
  }
};






export const sendMessage = async (req, res) => {
  const { chatId, content, type, mediaUrl, mediaType, callInfo } = req.body;

  if (!chatId) return res.status(400).json({ message: "Chat ID is required" });

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

    // 🔹 Update chat with latest message
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
    res.status(500).json({
      message: "Failed to send message",
      error: error.message,
    });
  }
};

export const fetchMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .populate("senderId", "name email pic") // include profile pic if available
      .populate({
        path: "replyTo",
        populate: { path: "senderId", select: "name email pic" },
      })
      .populate({
        path: "chatId",
        populate: { path: "users", select: "name email pic" },
      })
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ Error in fetchMessages:", error);
    res.status(500).json({
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};


export const startCall = async (req, res) => {
  const { chatId, callType, receiverId } = req.body;

  if (!chatId || !callType)
    return res
      .status(400)
      .json({ message: "Chat ID and call type are required" });

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
    res
      .status(500)
      .json({ message: "Failed to start call", error: error.message });
  }
};

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
    res
      .status(500)
      .json({ message: "Failed to update call status", error: error.message });
  }
};


// REPLY TO THE MESSAGE

export const replyMessage = async (req, res) => {
  try {
    console.log("📩 Incoming replyMessage body:", req.body);

    const { chatId, content, replyTo } = req.body;
    if (!chatId || !content || !replyTo) {
      console.warn("⚠️ Missing required fields:", { chatId, content, replyTo });
      return res
        .status(400)
        .json({ message: "chatId, content, and replyTo are required." });
    }

    const newMessage = await Message.create({
      chatId,
      senderId: req.user._id,
      content,
      type: "text",
      replyTo,
    });

    console.log("✅ Created message:", newMessage);

    const populated = await newMessage.populate([
      { path: "senderId", select: "name email pic" },
      {
        path: "replyTo",
        populate: { path: "senderId", select: "name email pic" },
      },
      { path: "chatId", select: "chatName isGroupChat users" },
    ]);

    console.log("✅ Populated reply message:", populated);

    await Chat.findByIdAndUpdate(chatId, { latestMessage: newMessage });

    const io = req.app.get("io");
    if (io) io.to(chatId.toString()).emit("message received", populated);

    return res.status(201).json(populated);
  } catch (error) {
    console.error("❌ replyMessage error:", error.message, error.stack);
    res.status(500).json({ message: "Failed to reply to the message" });
  }
};



// group chat controllers 

// create a new group chat 
export const createGroupChat = async(req,res) => {
  try {
    const { users,chatName } = req.body;
    if(!users || !chatName ) {
      return res.status(400).json({message:"Pleasee provide the users and the chatname "});
    }

    let parsedUsers;
    try {
      parsedUsers = typeof users === "string" ? JSON.parse(users) : users;
    } catch (error) {
      return res.status(400).json({message:"Invalid user format"});
      
    }

    if(parsedUsers.length < 2) {
      return res.status(400).json({message:"A group chat must have at least 3 members"});
    }
    parsedUsers.push(req.user._id);

    const groupChat = await Chat.create({
      chatName,
      users:parsedUsers,
      isGroupChat:true,
      groupAdmin:req.user._id,
    })

    const fullGroupChat = await Chat.findById(groupChat._id).populate("users","-password").populate("groupAdmin","-password");
res.status(201).json(fullGroupChat);

  } catch (error) {
    console.error("Error in creating groupchat:",error);
    res.status(500).json({message:"Faild to create group chat"});
  }
};

// Fetch all  group chat for the current user
// ✅ Fetch all group chats for current user
export const fetchGroupChats = async (req, res) => {
  try {
    const groups = await Chat.find({
      isGroupChat: true,
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate({
        path: "latestMessage",
        populate: {
          path: "senderId",
          select: "name email",
        },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("❌ Error in fetchGroupChats:", error);
    res.status(500).json({ message: "Failed to fetch group chats" });
  }
};

// Rename a group chat
export const renameGroupChat = async(req,res) => {
  try {
    const { chatId, chatName} = req.body;

    if(!chatId || !chatName ) {
      return  res.status(400).json({message:"ChatId and Chatname is required"});
    }
    const updateChat = await Chat.findByIdAndUpdate(
      chatId,
      {chatName},
      {new:true}
    ).populate("users","-password").populate("groupAdmin","-password");

    if(!updateChat) {
      return res.status(404).json({message:"chat not found"})
    }

    res.status(200).json(updateChat);
  } catch (error) {
    console.error("Error renaming the chat",error);
    res.status(500).json({message:"Internal server error faild to rename the group"});
    
  }
}
