import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { Text } from "../models/text.model.js";

export const addText = asyncHandler(async (req, res) => {
  const { destinationPerson, destinationBank, amount } = req.body;

  if (!destinationPerson || !destinationBank || amount == null) {
    throw new ApiError(400, "All fields are required");
  }

  const newtext = new Text({
    destinationPerson,
    destinationBank,
    amount,
  });

  const savedText = await newtext.save();

  if (!savedText) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, savedText, "Text added successfully"));
});

export const getText = asyncHandler(async (req, res) => {
  const texts = await Text.find();

  if (!texts) {
    throw new ApiError(404, "No text entries found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, texts, "Text entries retrieved successfully"));
});
