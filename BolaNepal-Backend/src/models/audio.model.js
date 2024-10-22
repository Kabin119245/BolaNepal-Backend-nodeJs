import mongoose, { Schema } from "mongoose";

const audioSchema = new Schema(
  {
    audioFile: {
      type: String, //cloudinary
      required: true,
    },
    ownerUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },

  { timestamps: true }
);

export const Audio = mongoose.model("Audio", audioSchema);
