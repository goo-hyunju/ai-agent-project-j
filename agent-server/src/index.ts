import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { runFdsAgent } from "./agents/fdsAgent";
import { runLogAgent } from "./agents/logAgent";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.post("/agent/run", upload.single("file"), async (req, res) => {
  try {
    const mode = (req.body.mode as "fds" | "log") || "fds";
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "file is required" });
    }

    const filePath = path.resolve(file.path);
    let result;

    if (mode === "fds") {
      result = await runFdsAgent(filePath);
    } else {
      result = await runLogAgent(filePath);
    }

    // 업로드 파일 제거 (임시)
    fs.unlink(filePath, () => {});

    res.json({ mode, result });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message ?? "agent error" });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Agent server listening on http://localhost:${PORT}`);
});

