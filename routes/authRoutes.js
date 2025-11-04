import express from "express";
import { register, login, deactivateUser, reactivateUser, deleateUser, getMyDetails, searchUsers } from "../Controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// 🔹 GET /api/user?search=keyword
router.get("/", authMiddleware, searchUsers);

router.get("/me", authMiddleware, getMyDetails);



router.put("/deactivate/:id", deactivateUser);
router.put("/reactivate/:id", reactivateUser);

router.delete("/:id", deleateUser);


export default router;
