# ANKA - Professional AI Dashboard Architecture

## 📐 System Overview

ANKA es una plataforma de gestión de chats AI tipo Dashboard profesional, construida con **React (Vite)** + **Express** + **Llama3 (Ollama)**.

### Core Tech Stack

- **Frontend**: React 18 + Vite 5.0 + Framer Motion + Tailwind CSS
- **Backend**: Express 5.2 + Node.js
- **File Upload**: Multer (50MB max por archivo)
- **Persistencia**: JSON (chats.json)
- **AI Engine**: Ollama (Llama3)
- **Audio**: Web Speech API (español) + Whisper (server-side)

---

## 🏗️ Architecture Layers

### 1. FRONTEND LAYER (src/frontend/src/)

#### Components Structure

```
components/
├── ChatSidebar.jsx          # Panel izquierdo - lista de chats
├── ChatWindow.jsx           # Área central - visualización de mensajes
├── ChatInput.jsx            # Área inferior - input + controles
├── FileUploader.jsx         # Carga de archivos con preview
├── SpeechButton.jsx         # Botón de voz con fallback
├── Toast.jsx                # Notificaciones elegantes
├── OrbDiagnosticWidget.jsx  # Widget flotante (CPU/Memory)
└── OrbDiagnostic.jsx        # [DEPRECATED - mantener para compatibilidad]

hooks/
└── useChat.js               # Custom hook - lógica de chats

App.jsx                       # Componente raíz - layout 3-columnas
```

#### Layout (CSS Grid - 3 Columnas)

```
┌──────────────┬─────────────────────┐
│              │                     │
│  Sidebar     │  Main Chat Area     │
│  (w-64)      │  (flex-1)           │
│              │                     │
│  - New Chat  │  ┌─────────────────┐│
│  - History   │  │ Chat Messages   ││
│  - Metrics   │  │ (auto-scroll)   ││
│              │  ├─────────────────┤│
│              │  │ Input Zone      ││
│              │  │ - File Upload   ││
│              │  │ - Text Input    ││
│              │  │ - Mic Button    ││
│              │  └─────────────────┘│
│              │                     │
└──────────────┴─────────────────────┘
                ┌─────────────────────┐
                │ OrbDiagnosticWidget │
                │ (fixed bottom-right)│
                └─────────────────────┘
```

#### Key Features

**ChatSidebar**

- Lista de chats con contador de mensajes
- Botón "New Chat" que crea chats con nombre personalizado
- Indicador visual del chat activo
- Loading state para operaciones asincrónicas

**ChatWindow**

- Mensajes organizados por rol (user/ai)
- Soporte para archivos adjuntos con links descargables
- Auto-scroll al nuevo mensaje
- Timestamps con formato local

**ChatInput**

- TextArea multilínea (Shift+Enter para salto de línea)
- Enter para enviar
- FileUploader integrado (preview de imágenes)
- SpeechButton con fallback para navegadores incompatibles
- Toast para notificaciones

**FileUploader**

- Tipos permitidos: imágenes, PDF, text, audio
- Límite: 50MB por archivo
- Preview de imágenes
- Icono + metadata para otros tipos
- Botón para limpiar selección

**SpeechButton**

- Web Speech API (español, lang="es-ES")
- Fallback elegante si no está soportado
- Estado visual: "🎤 START VOICE" / "🎙️ LISTENING..."
- Error handling con Toast

---

### 2. BACKEND LAYER (src/backend/)

#### Directory Structure

```
backend/
├── server.js                      # Express app + endpoints
├── middleware/
│   └── uploadHandler.js           # Multer config
├── data/
│   └── chats.json                 # Persistencia de chats
└── services/
    ├── chatService.js             # Ollama integration
    ├── ollamaService.js           # Error analysis
    └── whisper_server.py          # Audio transcription
```

#### Endpoints

**Chat Management**

```
GET  /api/chats                    # Obtener todos los chats
POST /api/chats                    # Crear nuevo chat
GET  /api/chats/:chatId            # Obtener chat específico
POST /api/chats/:chatId/messages   # Agregar mensaje (o archivo)
```

**System Status**

```
GET  /api/system-status            # CPU + Memory metrics en tiempo real
```

**Chat (Legacy - mantener para compatibilidad)**

```
POST /api/chat                     # Chat directo sin persistencia
POST /api/analyze                  # Análisis de error logs
POST /api/transcribe-file          # Transcripción Whisper
```

**Static**

```
GET  /uploads/*                    # Descargar archivos subidos
GET  /*                            # SPA routing (index.html)
```

#### Database Schema (chats.json)

```json
{
  "chats": [
    {
      "id": "default",
      "name": "General Chat",
      "createdAt": "2026-06-01T...",
      "messages": [
        {
          "id": "msg-1717200000000",
          "role": "user",
          "content": "¿Hola?",
          "timestamp": "2026-06-01T...",
          "file": null
        },
        {
          "id": "msg-1717200001000",
          "role": "ai",
          "content": "¡Hola! ¿En qué puedo ayudarte?",
          "timestamp": "2026-06-01T...",
          "file": null
        }
      ]
    }
  ]
}
```

#### File Upload Flow

1. Cliente selecciona archivo vía FileUploader
2. Frontend envía FormData con `message` + `file` a `/api/chats/:chatId/messages`
3. Multer valida tipo + tamaño
4. Backend guarda en `/uploads/{nombre}-{timestamp}.{ext}`
5. Metadata se persiste en chats.json
6. Frontend puede descargar via link `/uploads/{filename}`

#### Error Handling

- Try/catch en todos los endpoints
- JSON responses: `{ success: true/false, error: "...", data: {...} }`
- Logging a error.log
- Toast notifications en frontend

---

### 3. COMMUNICATION LAYER

#### Request/Response Flow

**Sending a Chat Message**

```
User types "¿Qué es IA?" →
ChatInput.jsx sends POST /api/chats/default/messages
    { message: "¿Qué es IA?", file: null } →
Express validates + calls Ollama →
Ollama returns AI response →
Backend saves both (user + ai) to chats.json →
Backend returns { success: true, userMessage: "...", aiResponse: "..." } →
Frontend reloads chat via loadChat(chatId) →
ChatWindow displays new messages
```

**Uploading a File**

```
User selects image.jpg →
FileUploader shows preview →
User clicks SEND →
ChatInput sends FormData with file →
Multer saves to /uploads/image-1234567890.jpg →
Backend persists metadata to chats.json →
Frontend displays message with download link
```

**Microphone Input**

```
User clicks "🎤 START VOICE" →
SpeechButton starts Web Speech API recognition (es-ES) →
User speaks: "Dame un resumen" →
onresult event captures transcript →
ChatInput receives transcript →
Auto-sends message to backend →
System displays response
```

---

## 🎨 UI/UX Design

### Color Palette (Sci-Fi Cyberpunk)

- **Navy (Anka)**: `#050510`
- **Cyan (Neon)**: `#00f2ff`
- **Violet (Electric)**: `#8b5cf6`
- **Error (Red)**: `#ff4444`

### Typography

- **Headers**: JetBrains Mono (Bold, tracking-widest)
- **Body**: Fira Code (Regular, text-xs)
- **Input**: Fira Code (sm)

### Components

- Glassmorphism: `backdrop-blur-xl bg-white/5 border border-white/10`
- Gradients: `from-[#00f2ff] to-[#8b5cf6]`
- Animations: Framer Motion (scale, opacity, x transitions)

---

## 🔄 State Management

### Frontend (useChat Hook)

```javascript
const {
  chats, // array de chats
  currentChatId, // ID del chat activo
  currentChat, // objeto chat completo
  loading, // boolean para operaciones
  error, // string de error
  loadChats, // fn() → fetch /api/chats
  loadChat, // fn(id) → fetch /api/chats/:id
  createChat, // fn(name) → POST /api/chats
  sendMessage, // fn(text, file?) → POST /api/chats/:id/messages
} = useChat();
```

### Backend (Node.js In-Memory + Disk)

- En-memoria: Express app context
- Persistencia: chats.json (fsync)
- No database → simple, no SQL, fácil backup

---

## 🔐 Security Considerations

### Implemented

- ✅ File type validation (whitelist MIME types)
- ✅ File size limit (50MB)
- ✅ Unique filenames (timestamp + random)
- ✅ Error logging without exposing internals
- ✅ CORS proxy via Vite (dev) + static serving (prod)

### To Implement (Future)

- ⚠️ Rate limiting on /api endpoints
- ⚠️ Input sanitization (XSS protection)
- ⚠️ Chat encryption at rest
- ⚠️ User authentication (JWT)
- ⚠️ File virus scanning (ClamAV)

---

## 🚀 Deployment

### Development

```bash
npm run dev          # Inicia server + client concurrently
                     # Backend: http://localhost:3000
                     # Frontend: http://localhost:5173
```

### Production

```bash
npm run build        # Construye frontend (dist/)
npm run start        # Express sirve frontend + API
                     # Ambos en http://localhost:3000
```

### Docker Ready

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📊 Performance Optimizations

- **Code Splitting**: React lazy loading por componentes
- **Debouncing**: Speech API results
- **Memoization**: `useCallback` en hooks
- **Auto-scroll**: useEffect dependency management
- **Streaming**: Backend chunked responses (preparado)
- **Cache**: Frontend message history via loadChat

---

## 🧪 Testing Strategy

### Frontend

- Component unit tests (Jest + React Testing Library)
- Integration tests (user flows)
- E2E tests (Cypress: create chat → send message → upload file)

### Backend

- API endpoint tests (Supertest + Jest)
- File upload tests (multer validation)
- Error handling tests

### QA

- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile responsiveness
- Accessibility (WCAG 2.1 AA)

---

## 📝 Development Roadmap

### Phase 1 (✅ Complete)

- [x] Dashboard 3-column layout
- [x] Chat CRUD operations
- [x] File upload + persistence
- [x] Web Speech API integration
- [x] System metrics widget

### Phase 2 (Planned)

- [ ] User authentication (JWT)
- [ ] Chat search + filters
- [ ] Message reactions/emojis
- [ ] Dark mode toggle
- [ ] Export chat as PDF

### Phase 3 (Future)

- [ ] Real-time collaboration (WebSockets)
- [ ] Vector embeddings + RAG
- [ ] Custom AI model fine-tuning
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

---

## 🐛 Known Issues

- Speech API not supported in some browsers (handled with fallback)
- Ollama must be running on localhost:11434
- Chat.json grows unbounded (need pagination/archiving)
- No user isolation (single user per instance)

---

## 📚 References

- [Vite Docs](https://vitejs.dev)
- [Express.js](https://expressjs.com)
- [Multer File Upload](https://github.com/expressjs/multer)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Framer Motion](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com)

---

**Version**: 1.0  
**Last Updated**: June 1, 2026  
**Author**: ANKA Development Team
