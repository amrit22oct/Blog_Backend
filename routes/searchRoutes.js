import express from "express";
import { searchAll } from "../Controllers/searchController.js";

const router = express.Router();

router.get("/",searchAll);

export default router;