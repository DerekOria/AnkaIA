import express from "express";

import upload from "../middleware/uploadHandler.js";
import { chatWithLlama, streamChatWithLlama } from "../../services/ai/chatService.js";
import { logErrorToFile } from "../utils/logger.js";

import {
  loadChatsFromDisk,
  getChatById,
  createChat,
  addMessageToChat,
  updateMessageInChat,
} from "../storage/chatStorage.js";

const router = express.Router();

// POST /api/chat
router.post("/chat", async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: "message is required",
    });
  }

  try {
    const aiText = await chatWithLlama(message, history || []);

    return res.json({
      success: true,
      reply: aiText,
    });
  } catch (error) {
    console.error("/api/chat error:", error);
    logErrorToFile(error.message || JSON.stringify(error));

    return res.status(500).json({
      success: false,
      error: "Internal error",
    });
  }
});

// GET /api/chats
router.get("/chats", (req, res) => {
  try {
    const chatsData = loadChatsFromDisk();

    return res.json({
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

    return res.status(500).json({
      success: false,
      error: "Failed to load chats",
    });
  }
});

// GET /api/chats/:chatId
router.get("/chats/:chatId", (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = getChatById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: "Chat not found",
      });
    }

    return res.json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error("/api/chats/:chatId error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to load chat",
    });
  }
});

// POST /api/chats
router.post("/chats", (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Chat name required",
      });
    }

    const newChat = createChat(name);

    return res.json({
      success: true,
      chat: newChat,
    });
  } catch (error) {
    console.error("/api/chats POST error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to create chat",
    });
  }
});

// POST /api/chats/:chatId/messages
router.post("/chats/:chatId/messages", upload.single("file"), async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;

    if (!message && !req.file) {
      return res.status(400).json({
        success: false,
        error: "Message or file required",
      });
    }

    const chat = getChatById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: "Chat not found",
      });
    }

    if (!req.file) {
      const userMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };

      addMessageToChat(chatId, userMessage);

      const aiResponse = await chatWithLlama(message, chat.messages || []);

      const aiMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "ai",
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };

      addMessageToChat(chatId, aiMessage);

      return res.json({
        success: true,
        userMessage,
        aiMessage,
        aiResponse,
      });
    }

    const fileMessage = {
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

    addMessageToChat(chatId, fileMessage);

    return res.json({
      success: true,
      message: "File uploaded and saved",
      fileMessage,
      file: fileMessage.file,
    });
  } catch (error) {
    console.error("/api/chats/:chatId/messages error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});


// POST /api/chat/stream
router.post("/chat/stream", async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: "message is required",
    });
  }

  try {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    await streamChatWithLlama(message, history || [], (chunk) => {
      res.write(chunk);
    });

    res.end();
  } catch (error) {
    console.error("/api/chat/stream error:", error);
    logErrorToFile(error.message || JSON.stringify(error));

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: "Internal streaming error",
      });
    }

    res.write("\n[Erreur: streaming interrompu]");
    res.end();
  }
});

// POST /api/chats/:chatId/messages/stream
router.post("/chats/:chatId/messages/stream", async (req, res) => {
  const { chatId } = req.params;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      error: "Message is required",
    });
  }

  const chat = getChatById(chatId);

  if (!chat) {
    return res.status(404).json({
      success: false,
      error: "Chat not found",
    });
  }

  const userMessage = {
    id: `msg-${Date.now()}`,
    role: "user",
    content: message,
    timestamp: new Date().toISOString(),
  };

  const aiMessageId = `msg-${Date.now() + 1}`;

  const aiMessage = {
    id: aiMessageId,
    role: "ai",
    content: "",
    timestamp: new Date().toISOString(),
    streaming: true,
  };

  addMessageToChat(chatId, userMessage);
  addMessageToChat(chatId, aiMessage);

  try {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullText = "";

    const history = chat.messages || [];

    await streamChatWithLlama(message, history, (chunk) => {
      fullText += chunk;
      res.write(chunk);
    });

    updateMessageInChat(chatId, aiMessageId, {
      content: fullText,
      streaming: false,
      completedAt: new Date().toISOString(),
    });

    res.end();
  } catch (error) {
    console.error("/api/chats/:chatId/messages/stream error:", error);

    updateMessageInChat(chatId, aiMessageId, {
      content: "Erreur: impossible de streamer la réponse d'ANKA.",
      streaming: false,
      error: true,
      completedAt: new Date().toISOString(),
    });

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: "Internal streaming error",
      });
    }

    res.write("\nErreur: streaming interrompu.");
    res.end();
  }
});



export default router;