import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { Text } from "../models/text.model.js";

export const addText = asyncHandler(async (req, res) => {
  const data = req.body; // Input can be a single object or an array

  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new ApiError(
      400,
      "A single text object or an array of text objects is required"
    );
  }

  // Normalize the input to always work with an array
  const texts = Array.isArray(data) ? data : [data];

  // Validate each object in the array
  for (const text of texts) {
    const { destinationPerson, destinationBank, amount } = text;

    if (!destinationPerson || !destinationBank || amount == null) {
      throw new ApiError(400, "Each text object must have all required fields");
    }
  }

  // Save the objects to the database
  const savedTexts = await Text.insertMany(texts);

  if (!savedTexts || savedTexts.length === 0) {
    throw new ApiError(500, "Something went wrong while saving texts");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, savedTexts, "Texts added successfully"));
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
