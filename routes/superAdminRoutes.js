import express from "express";
import { deleteUser, getAllArticles, getAllBlogs, getAllForumThreads, getAllUsers, getUserDetails, updateUser, updateUserRole } from "../Controllers/superAdminController.js";
import { authMiddleware, isSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware,isSuperAdmin);

router.get("/users", getAllUsers);
router.get("/users/:id", getUserDetails);
router.patch("/users/edit/:id", isSuperAdmin, updateUserRole);
router.patch("/users/:id", isSuperAdmin, updateUser);
router.delete("/users/:id", isSuperAdmin, deleteUser);


router.get("/blogs", isSuperAdmin, getAllBlogs);
router.get("/articles", isSuperAdmin, getAllArticles);
router.get("/threads", isSuperAdmin, getAllForumThreads);

export default router;