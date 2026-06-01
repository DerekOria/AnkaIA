# ANKA - AI Dashboard Chat Platform

**ANKA** es una plataforma profesional de gestión de chats AI tipo Dashboard, con UI sci-fi, soporte para carga de archivos, Web Speech API, y persistencia en tiempo real.

## 🚀 Features

- ✨ **3-Column Dashboard Layout** - Sidebar, Chat Area, Floating System Widget
- 💬 **Chat Management** - Crear, cargar, y cambiar entre múltiples chats
- 📤 **File Upload** - Soporte para imágenes, PDF, audio, text (50MB max)
- 🎙️ **Web Speech API** - Reconocimiento de voz en español con fallback elegante
- 📊 **Real-time Metrics** - CPU & Memory widget flotante actualizado cada 1s
- 🤖 **Ollama Integration** - Llama3 local AI engine
- 🎨 **Sci-Fi UI** - Glassmorphism, Framer Motion animations, Dark theme
- 💾 **Persistencia** - JSON-based chat storage con auto-save
- ⚡ **Production Ready** - Error handling, logging, CORS proxy

---

## 📋 Prerequisites

- **Node.js** 18+ (with npm)
- **Ollama** running on `localhost:11434` with Llama3 model
- **Python** 3.8+ (para Whisper transcription)
- **ffmpeg** (para audio conversion)

### Quick Check

```bash
node --version && npm --version && ollama --version && python --version && ffmpeg -version
```

---

## 🔧 Installation

### 1. Install Node Dependencies

```bash
npm install
```

### 2. Install Python Environment

```bash
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1

# Windows CMD
.venv\Scripts\activate

# Mac/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Verify Ollama

```bash
# Terminal 3
ollama serve
# Expected: Listening on 127.0.0.1:11434
```

---

## ▶️ Running the Application

### Development Mode (Recommended)

```bash
npm run dev
# Automatically opens http://localhost:5173 (Vite)
# Backend at http://localhost:3000
```

### Production Mode

```bash
npm run build
npm start
# Navigate to http://localhost:3000
```

### Separate Terminals

```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run client

# Terminal 3: Ollama (if not running as service)
ollama serve
```

---

## 📁 Project Structure

```
ANKA/
├── src/
│   ├── backend/
│   │   ├── server.js                      # Express + API
│   │   ├── middleware/uploadHandler.js    # Multer config
│   │   ├── data/chats.json                # Chat persistence
│   │   └── services/
│   │       ├── chatService.js
│   │       ├── ollamaService.js
│   │       └── whisper_server.py
│   └── frontend/
│       ├── src/
│       │   ├── App.jsx                    # 3-column layout
│       │   ├── components/                # UI components
│       │   ├── hooks/useChat.js           # State management
│       │   └── index.css
│       ├── index.html
│       └── vite.config.js
├── uploads/                               # Uploaded files
├── tmp_uploads/                           # Temporary
├── ARCHITECTURE.md                        # Detailed docs
└── package.json
```

---

## 🎮 Usage Guide

### Create Chat

1. Click **"+ New Chat"** button
2. Enter chat name
3. Start typing or speaking

### Send Message

- **Keyboard**: Type message, press `Enter`
- **Voice**: 🎤 Click button, speak in Spanish
- **File**: 📎 Click attach, select file, add message

### Switch Chats

- Click any chat in sidebar
- Message history loads automatically
- Files remain downloadable

---

## 🔌 API Reference

```
GET  /api/chats                    # List all chats
POST /api/chats                    # Create chat
GET  /api/chats/:chatId            # Get chat
POST /api/chats/:chatId/messages   # Send message
GET  /api/system-status            # CPU/Memory
GET  /uploads/:filename            # Download file
```

---

## 🛠️ Troubleshooting

| Problem                  | Solution                           |
| ------------------------ | ---------------------------------- |
| "ECONNREFUSED" error     | Run `npm run server` first         |
| Voice not working        | Use Chrome/Edge, not Safari        |
| Ollama connection failed | Run `ollama serve` in new terminal |
| File upload fails        | Max 50MB, check file type          |
| Chats not saving         | Check `chats.json` permissions     |

---

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Full system design
- **[Setup Guide](./docs/TP1/SETUP.md)** - Detailed setup

---

## 🚀 Deployment

### Docker

```bash
docker build -t anka .
docker run -p 3000:3000 anka
```

### Production Checklist

- [ ] Add authentication (JWT)
- [ ] Enable HTTPS
- [ ] Move uploads to S3
- [ ] Set up PostgreSQL
- [ ] Configure rate limiting

---

## 📝 Notes

- Llama3 model auto-downloads on first run
- Chats persist in `src/backend/data/chats.json`
- Supports ES-ES Spanish for voice recognition
- Max file size: 50MB

---

**Version**: 1.0 | **Status**: Production Ready ✅
