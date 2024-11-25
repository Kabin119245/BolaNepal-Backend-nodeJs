import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Audio } from "../models/audio.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const uploadAudio = asyncHandler(async (req, res) => {
  const audioLocalPath = req.files?.audio[0].path;

  if (!audioLocalPath) {
    throw new ApiError(400, "Audio is required");
  }

  // Step 1: Determine the next audio file name
  const lastAudio = await Audio.findOne().sort({ createdAt: -1 }); // Get the most recent audio file
  let nextFileName = "audio1"; // Default to "audio1" if no files exist

  if (lastAudio) {
    // Extract the numeric part of the last file name and increment
    const lastAudioNumber = parseInt(
      lastAudio.audioFile.match(/audio(\d+)/)?.[1] || 0
    );
    nextFileName = `audio${lastAudioNumber + 1}`;
  }

  const audioFileUpload = await uploadOnCloudinary(
    audioLocalPath,
    nextFileName
  );

  if (!audioFileUpload) {
    throw new ApiError(400, "audio is required");
  }

  const audio = await Audio.create({
    audioFile: audioFileUpload.url,
  });

  const createdAudio = await Audio.findById(audio._id);

  if (!createdAudio) {
    throw new ApiError(500, "Something went wrong while uploading audio");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdAudio, "Audio uploaded successfully"));
});

const getAllAudioUrls = asyncHandler(async (req, res) => {
  const audioEntries = await Audio.find();
  if (!audioEntries) {
    throw new ApiError(404, "No audio entries found");
  }

  const audioUrls = audioEntries.map((entry) => entry.audioFile);

  return res
    .status(201)
    .json(new ApiResponse(200, audioUrls, "Audio Urls retrieved successfully"));
});

export { uploadAudio, getAllAudioUrls };
