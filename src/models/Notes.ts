import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      min: 1,
      max: 100,
    },
    content: {
      type: String,
      required: true,
      min: 1,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
    sharedId: { type: String, unique: true, sparse: true },
 
  },
  { timestamps: true }
);

const Notes = mongoose.model("Note", NoteSchema);
export default Notes;
