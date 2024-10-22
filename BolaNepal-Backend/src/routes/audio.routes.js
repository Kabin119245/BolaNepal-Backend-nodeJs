import { Router } from "express";
import {
  uploadAudio,
  getAllAudioUrls,
} from "../controllers/audio.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/upload")
  .post(
    verifyJWT,
    upload.fields([{ name: "audio", maxCount: 1 }]),
    uploadAudio
  );

router.route("/getaudios").get(verifyJWT, getAllAudioUrls);

export default router;
