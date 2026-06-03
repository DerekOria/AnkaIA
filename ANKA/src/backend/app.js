import express from "express";
import path from "path";

import chatRoutes from "./routes/chat.routes.js";
import diagnosticRoutes from "./routes/diagnostic.routes.js";
import filesRoutes from "./routes/files.routes.js";
import systemRoutes from "./routes/system.routes.js";
import voiceRoutes from "./routes/voice.routes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

const FRONTEND_DIR = path.join(process.cwd(), "src", "frontend");

app.use(express.json());

// Serve frontend static files
app.use(express.static(FRONTEND_DIR));

// Serve uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// API routes
app.use("/api", chatRoutes);
app.use("/analyze", diagnosticRoutes);
app.use("/api", filesRoutes);
app.use("/api/system-status", systemRoutes);
app.use("/api/voice", voiceRoutes);

// React / Vite SPA fallback
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) {
    return next();
  }

  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// Global error handler
app.use(errorHandler);

export default app;