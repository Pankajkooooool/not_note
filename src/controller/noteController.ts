import { Request, Response } from "express";
import Notes from "../models/Notes";
import { v4 as uuidv4 } from "uuid"; 

// Create a new note
export const createNote = async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const newNote = new Notes({
      title,
      content,
      author: req.user!.id, // Attach the user ID from the token
    });

    await newNote.save();
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ message: "Error creating note", error });
  }
};

// Get all notes for the logged-in user
export const getNotes = async (req: Request, res: Response) => {
  try {
    const notes = await Notes.find({ 
      author: req.user!.id,
      sharedId: {$exists:false}
     }); // Fetch only the user's notes
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notes", error });
  }
};

// Delete a note
export const deleteNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const note = await Notes.findById(id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.author.toString() !== req.user!.id) {
      return res.status(403).json({ message: "You are not authorized to delete this note" });
    }

    await note.deleteOne();
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting note", error });
  }
};


// Share a note
export const shareNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const note = await Notes.findById(id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.author.toString() !== req.user!.id) {
      return res.status(403).json({ message: "You are not authorized to share this note" });
    }

    // Generate a unique shared ID
    const sharedId = uuidv4();

    // Create a shared copy of the note
    const sharedNote = new Notes({
      title: note.title,
      content: note.content,
      sharedId,
      author: note.author, // Keep the original author reference for ownership tracking
    });

    await sharedNote.save();

    res.status(200).json({ message: "Note shared successfully", sharedId });
  } catch (error) {
    res.status(500).json({ message: "Error sharing note", error });
  }
};


// Fetch a shared note
export const getSharedNote = async (req: Request, res: Response) => {
  try {
    const { sharedId } = req.params;
    console.log(sharedId,"hi")

    const sharedNote = await Notes.findOne({ sharedId });
    console.log(sharedNote,"hi2")
    if (!sharedNote) {
      return res.status(404).json({ message: "Shared note not found" });
    }

    res.status(200).json(sharedNote);
  } catch (error) {
    res.status(500).json({ message: "Error fetching shared note", error });
  }
};
