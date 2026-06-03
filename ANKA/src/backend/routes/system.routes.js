import express from "express";
import os from "os";

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);

    const cpus = os.cpus();
    const loadavg = os.loadavg();
    const cpuPercentage = Math.round((loadavg[0] * 100) / cpus.length);

    return res.json({
      success: true,
      cpu: Math.min(cpuPercentage, 100),
      memory: memoryPercentage,
      timestamp: new Date().toISOString(),
      systemStatus: "ONLINE",
    });
  } catch (error) {
    console.error("/api/system-status error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to get system status",
    });
  }
});

export default router;