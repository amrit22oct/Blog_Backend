import express from "express";
<<<<<<< HEAD
import { getProfile, updateProfile, changePassword } from "../controllers/profileController.js";
=======
import { getProfile, updateProfile, changePassword } from "../Controllers/profileController.js"
>>>>>>> 9dcec0fc076cbf516773b69ae996691f7220ecfe
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getProfile);
router.put("/update", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);

export default router;
