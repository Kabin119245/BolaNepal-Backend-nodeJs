import { Router } from "express";
import { addText, getText } from "../controllers/text.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/add").post(verifyJWT, addText);
router.route("/get").get(verifyJWT, getText);

export default router;
