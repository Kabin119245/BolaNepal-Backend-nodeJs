import mongoose, { Schema } from "mongoose";

const textSchema = new Schema({
  destinationPerson: {
    type: String,
    required: true,
  },
  destinationBank: {
    type: String,
    required: true,
  },
  amount: {
    type: String, //because of nepali fonts
    required: true,
  },
});

export const Text = mongoose.model("Text", textSchema);
