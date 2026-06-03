import express from "express";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

import upload from "../middleware/uploadHandler.js";
import { logErrorToFile } from "../utils/logger.js";

const router = express.Router();

router.post("/transcribe", (req, res) => {
  return res.status(501).json({
    success: false,
    error:
      "Use POST /api/transcribe-file with multipart/form-data field 'audio' to transcribe via Whisper on the server.",
  });
});

router.post("/transcribe-file", upload.single("audio"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "audio file is required",
    });
  }

  const audioPath = req.file.path;

  try {
    const py = process.env.PYTHON || "python";

    const script = path.join(
      process.cwd(),
      "src",
      "services",
      "whisper_server.py",
    );

    const out = execFileSync(py, [script, audioPath], {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });

    const transcript = out.toString().trim();

    return res.json({
      success: true,
      transcript,
    });
  } catch (err) {
    console.error("Transcription error:", err);
    logErrorToFile(err.message || JSON.stringify(err));

    return res.status(500).json({
      success: false,
      error: "Transcription failed",
      details: err.message,
    });
  } finally {
    fs.unlink(audioPath, () => {});
  }
});

export default router;