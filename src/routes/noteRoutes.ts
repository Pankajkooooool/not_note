import express from "express";
import { createNote, getNotes, deleteNote, shareNote, getSharedNote } from "../controller/noteController";
import { verifyToken } from "../middlewares/auth";
import { getAiContent } from "../controller/gemini";

const router = express.Router();

// Route for creating a note
router.post("/", verifyToken, createNote);
router.get("/", verifyToken, getNotes);
router.delete("/:id", verifyToken, deleteNote);
router.post("/:id/share", verifyToken, shareNote);

router.get("/share/:sharedId", getSharedNote);
router.post("/content/", verifyToken,getAiContent);
export default router;
