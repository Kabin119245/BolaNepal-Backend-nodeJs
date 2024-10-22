import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors());

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes
import userRouter from "./routes/user.routes.js";
import audioRouter from "./routes/audio.routes.js";
import textRouter from "./routes/text.routes.js";

//routes decleration
app.use("/api/v1/users", userRouter);

app.use("/api/v1/audios", audioRouter);

app.use("/api/v1/texts", textRouter);

export { app };
