# 🚀 ANKA — Setup Guía de Instalación y Ejecución

## 📋 Requisitos Previos

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Python** >= 3.8 (para Ollama y Whisper)

---

## 🔧 Instalación Completa

### Paso 1: Instalar Dependencias

```bash
npm install
```

Este comando instala **todas** las dependencias:

- Backend: Express, Ollama, Multer, Nodemon
- Frontend: React, ReactDOM, Framer Motion
- Herramientas de build: Vite, Tailwind CSS, PostCSS, Concurrently

---

## 🎮 Ejecutar el Proyecto

### Opción A: Ejecución Completa (Recomendada)

Abre la terminal en la raíz del proyecto y ejecuta:

```bash
npm run dev
```

Esto inicia **simultáneamente**:

- 🖥️ **Backend**: Node.js + Express en `http://localhost:3000`
- 🎨 **Frontend**: Vite + React en `http://localhost:5173`

**Nota**: El frontend está configurado con proxy automático `/api → localhost:3000`, así que no hay problemas de CORS.

---

### Opción B: Ejecutar por Separado

**Terminal 1 — Backend:**

```bash
npm run server
```

**Terminal 2 — Frontend:**

```bash
npm run client
```

---

## 📁 Estructura del Proyecto

```
ANKA/
├── src/
│   ├── backend/
│   │   └── server.js          # Express + Ollama + Whisper
│   ├── frontend/
│   │   ├── index.html         # HTML principal (Vite)
│   │   ├── src/
│   │   │   ├── main.jsx       # Entry point React
│   │   │   ├── App.jsx        # Componente principal
│   │   │   ├── index.css      # Estilos globales + Tailwind
│   │   │   └── components/
│   │   │       └── OrbDiagnostic.jsx  # Componente Sci-Fi
│   │   └── public/
│   ├── services/
│   │   ├── chatService.js
│   │   ├── ollamaService.js
│   │   └── whisper_server.py
│   └── vision/
│       ├── daemon.py
│       └── monitor.py
├── vite.config.js             # Configuración Vite + Proxy
├── tailwind.config.js         # Colores personalizados
├── postcss.config.js          # PostCSS para Tailwind
└── package.json               # Dependencias
```

---

## 🔌 Configuración de Proxy (Vite)

El archivo `vite.config.js` está configurado para redirigir todas las peticiones `/api/*` al backend:

```javascript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

**Esto significa**: Cuando React haga `fetch('/api/chat', ...)`, se redirige automáticamente a `http://localhost:3000/api/chat`.

---

## 🎨 OrbDiagnostic Component

El componente `OrbDiagnostic.jsx` incluye:

- ✅ **Glassmorphism**: backdrop-blur-xl + bordes translúcidos
- ✅ **Animaciones**: Pulsación suave + rotación orbital (Framer Motion)
- ✅ **Paleta Sci-Fi**: Deep Navy (#050510) + Cyan Neon (#00f2ff) + Electric Violet (#8b5cf6)
- ✅ **Tipografía**: JetBrains Mono + Fira Code
- ✅ **Métricas**: CPU Load + Memory Usage en tiempo real

### Uso en componentes:

```jsx
import OrbDiagnostic from "./components/OrbDiagnostic";

<OrbDiagnostic
  isDiagnostic={true}
  systemStatus="ONLINE"
  cpuUsage={72}
  memoryUsage={91}
  diagnosticMessage="Processing your request..."
/>;
```

---

## 🌐 URLs de Acceso

| Servicio          | Puerto | URL                                  |
| ----------------- | ------ | ------------------------------------ |
| Backend (Express) | 3000   | `http://localhost:3000`              |
| Frontend (Vite)   | 5173   | `http://localhost:5173`              |
| Proxy API         | —      | `/api/*` (automático desde frontend) |

---

## 📦 Build para Producción

Para compilar el frontend a HTML/JS/CSS optimizado:

```bash
npm run build
```

Esto genera la carpeta `src/frontend/dist/` con los archivos de producción.

Para previsualizar antes de desplegar:

```bash
npm run preview
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'framer-motion'"

**Solución**: Ejecuta `npm install` nuevamente:

```bash
npm install
```

### Error: "Port 3000 already in use"

**Solución**: Cambia el puerto en `src/backend/server.js`:

```javascript
const PORT = 3001; // Cambiar a otro puerto
```

Y actualiza el proxy en `vite.config.js`:

```javascript
target: "http://localhost:3001";
```

### Error: "Port 5173 already in use"

**Solución**: Usa otro puerto en `vite.config.js`:

```javascript
server: {
  port: 5174, // Cambiar puerto
  ...
}
```

---

## 💡 Tips & Mejores Prácticas

1. **Hot Reload**: Vite actualiza automáticamente cuando cambias código React (sin recargar la página).
2. **Componentes Modulares**: Crea nuevos componentes en `src/frontend/src/components/`.
3. **Estilos**: Usa clases Tailwind o crea archivos `.css` y importa en el componente.
4. **API Calls**: Todos tus `fetch('/api/...')` se comunican automáticamente con el backend sin CORS.

---

## 📚 Recursos Útiles

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Framer Motion](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**¡Tu proyecto ANKA está listo! 🚀 Ejecuta `npm run dev` y comienza a desarrollar.**
