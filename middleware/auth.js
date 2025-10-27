import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No token, authorization denied" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid token" });
  }
};

export const isSuperAdmin = (req,res,next) => {
  if(!req.user || req.user.role !== "superadmin") {
    return res.status(403).json({message: "Access denied superadmin only"});
  }
  next();
};

// ✅ Added alias for compatibility with routes using `protect`
export const protect = authMiddleware;
