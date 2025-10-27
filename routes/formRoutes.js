import express from "express";
import { createForm } from "../Controllers/formController.js";

const router = express.Router();

router.post("/", createForm);

export default router;
