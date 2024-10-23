import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  verifyEmail,
  resetPassword,
  forgotPassword,
  verifyResetCode,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/verifycode").post(verifyEmail);
router.route("/forgot-password").post(forgotPassword);
router.route("/verify-reset-code").post(verifyResetCode);
router.route("/reset-password").post(resetPassword);

router.route("/login").post(loginUser);
//secured routes

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

//for testing

router.get("/protected", verifyJWT, (req, res) => {
  res.json({ message: "Hello From Protected route" });
});

export default router;
