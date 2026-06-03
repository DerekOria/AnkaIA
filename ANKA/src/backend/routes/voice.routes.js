import express from "express";

const router = express.Router();

router.get("/status", (req, res) => {
  return res.json({
    success: true,
    voiceBackend: "not_connected_yet",
    message: "Voice backend will be added in Phase 5.",
  });
});

export default router;