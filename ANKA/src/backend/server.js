import express from "express";
import fs from "fs";
import path from "path";
import os from "os";
import { analyzeErrorLog } from "../services/ollamaService.js";
import { chatWithLlama } from "../services/chatService.js";
import upload from "./middleware/uploadHandler.js";
import { execFileSync } from "child_process";

const app = express();
const PORT = process.env.PORT || 3000;
const LOG_FILE = path.join(process.cwd(), "error.log");
const ANKA_DEBUG_MODE = true;
const FRONTEND_DIR = path.join(process.cwd(), "src", "frontend");
const CHATS_FILE = path.join(
  process.cwd(),
  "src",
  "backend",
  "data",
  "chats.json",
);
const TMP_UPLOADS_DIR = path.join(process.cwd(), "tmp_uploads");

if (!fs.existsSync(TMP_UPLOADS_DIR)) {
  fs.mkdirSync(TMP_UPLOADS_DIR, { recursive: true });
}

app.use(express.json());

// Servir la interfaz frontend estática
app.use(express.static(FRONTEND_DIR));

// Servir carpeta uploads (para descargar archivos)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Función para persistir errores
function logErrorToFile(errorMessage) {
  if (!ANKA_DEBUG_MODE) return;
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${errorMessage}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);
}

// ============ FUNCIONES UTILITARIAS PARA CHATS ============

function loadChatsFromDisk() {
  try {
    if (fs.existsSync(CHATS_FILE)) {
      const data = fs.readFileSync(CHATS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error loading chats:", err);
  }
  return {
    chats: [
      {
        id: "default",
        name: "General Chat",
        createdAt: new Date().toISOString(),
        messages: [],
      },
    ],
  };
}

function saveChatsToDisk(chatsData) {
  try {
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chatsData, null, 2));
    return true;
  } catch (err) {
    console.error("Error saving chats:", err);
    return false;
  }
}

function getChatById(chatId) {
  const chatsData = loadChatsFromDisk();
  return chatsData.chats.find((c) => c.id === chatId);
}

function addMessageToChat(chatId, messageObject) {
  const chatsData = loadChatsFromDisk();
  const chat = chatsData.chats.find((c) => c.id === chatId);
  if (chat) {
    chat.messages.push(messageObject);
    saveChatsToDisk(chatsData);
    return true;
  }
  return false;
}

app.post("/analyze", async (req, res) => {
  const { error_log } = req.body;

  if (!error_log) {
    return res.status(400).json({ error: "Le champ 'error_log' est requis." });
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

    // ¡Aquí está la magia! Registramos el error en el log
    logErrorToFile(error.message || JSON.stringify(error));

    return res.status(500).json({
      success: false,
      error: "Erreur interne lors du traitement.",
    });
  }
});

// Endpoint conversacional: recibe texto y devuelve respuesta de Llama3
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "message is required" });

  try {
    const aiText = await chatWithLlama(message, history || []);
    return res.json({ success: true, reply: aiText });
  } catch (error) {
    console.error("/api/chat error:", error);
    logErrorToFile(error.message || JSON.stringify(error));
    return res.status(500).json({ success: false, error: "Internal error" });
  }
});

// Transcripción de audio (servidor): placeholder que puede ser extendido para Whisper
app.post("/api/transcribe", (req, res) => {
  return res.status(501).json({
    success: false,
    error:
      "Use POST /api/transcribe-file with multipart/form-data (field 'audio') to transcribe via Whisper on the server.",
  });
});

app.post("/api/transcribe-file", upload.single("audio"), (req, res) => {
  if (!req.file)
    return res
      .status(400)
      .json({ success: false, error: "audio file is required" });
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
    return res.json({ success: true, transcript });
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

// Endpoint para obtener estado del sistema (CPU y Memory)
app.get("/api/system-status", (req, res) => {
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
      cpu: Math.min(cpuPercentage, 100), // Cap at 100%
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

// ============ ENDPOINTS PARA GESTIÓN DE CHATS ============

// GET: Obtener todos los chats
app.get("/api/chats", (req, res) => {
  try {
    const chatsData = loadChatsFromDisk();
    res.json({
      success: true,
      chats: chatsData.chats.map((chat) => ({
        id: chat.id,
        name: chat.name,
        createdAt: chat.createdAt,
        messageCount: chat.messages.length,
      })),
    });
  } catch (error) {
    console.error("/api/chats error:", error);
    res.status(500).json({ success: false, error: "Failed to load chats" });
  }
});

// GET: Obtener un chat específico por ID
app.get("/api/chats/:chatId", (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = getChatById(chatId);

    if (!chat) {
      return res.status(404).json({ success: false, error: "Chat not found" });
    }

    res.json({ success: true, chat });
  } catch (error) {
    console.error("/api/chats/:chatId error:", error);
    res.status(500).json({ success: false, error: "Failed to load chat" });
  }
});

// POST: Crear nuevo chat
app.post("/api/chats", (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, error: "Chat name required" });
    }

    const chatsData = loadChatsFromDisk();
    const newChatId = `chat-${Date.now()}`;
    const newChat = {
      id: newChatId,
      name,
      createdAt: new Date().toISOString(),
      messages: [],
    };

    chatsData.chats.push(newChat);
    saveChatsToDisk(chatsData);

    res.json({ success: true, chat: newChat });
  } catch (error) {
    console.error("/api/chats POST error:", error);
    res.status(500).json({ success: false, error: "Failed to create chat" });
  }
});

// POST: Añadir mensaje a un chat
app.post(
  "/api/chats/:chatId/messages",
  upload.single("file"),
  async (req, res) => {
    try {
      const { chatId } = req.params;
      const { message } = req.body;

      if (!message && !req.file) {
        return res
          .status(400)
          .json({ success: false, error: "Message or file required" });
      }

      // Si es un mensaje de texto normal (no archivo)
      if (!req.file) {
        // Enviar a Ollama para obtener respuesta
        let aiResponse = "Message received";
        try {
          const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "llama3",
              prompt: message,
              stream: false,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            aiResponse = data.response || "No response from AI";
          }
        } catch (err) {
          console.warn("Ollama not available, using default response");
        }

        // Guardar mensaje del usuario
        addMessageToChat(chatId, {
          id: `msg-${Date.now()}`,
          role: "user",
          content: message,
          timestamp: new Date().toISOString(),
        });

        // Guardar respuesta de AI
        addMessageToChat(chatId, {
          id: `msg-${Date.now() + 1}`,
          role: "ai",
          content: aiResponse,
          timestamp: new Date().toISOString(),
        });

        res.json({
          success: true,
          userMessage: message,
          aiResponse,
        });
      } else {
        // Manejo de archivos
        const fileData = {
          id: `msg-${Date.now()}`,
          role: "user",
          content: message || `Uploaded file: ${req.file.originalname}`,
          file: {
            originalName: req.file.originalname,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            url: `/uploads/${req.file.filename}`,
          },
          timestamp: new Date().toISOString(),
        };

        addMessageToChat(chatId, fileData);

        res.json({
          success: true,
          message: "File uploaded and saved",
          file: fileData.file,
        });
      }
    } catch (error) {
      console.error("/api/chats/:chatId/messages error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`✅ ANKA Backend server running on port ${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   - POST /api/chat`);
  console.log(`   - POST /api/transcribe-file`);
  console.log(`   - GET /api/system-status`);
  console.log(`   - POST /analyze`);
});
