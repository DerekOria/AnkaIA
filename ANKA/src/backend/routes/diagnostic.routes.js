import express from "express";

import { analyzeErrorLog } from "../../services/ai/ollamaService.js";
import { logErrorToFile } from "../utils/logger.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { error_log } = req.body;

  if (!error_log) {
    return res.status(400).json({
      success: false,
      error: "Le champ 'error_log' est requis.",
    });
  }

  try {
    const rawAiResponse = await analyzeErrorLog(error_log);
    const structuredDiagnostic = JSON.parse(rawAiResponse);

    return res.json({
      success: true,
      diagnostic: structuredDiagnostic,
    });
  } catch (error) {
    console.error("Erreur sur la route /analyze:", error);
    logErrorToFile(error.message || JSON.stringify(error));

    return res.status(500).json({
      success: false,
      error: "Erreur interne lors du traitement.",
    });
  }
});

export default router;