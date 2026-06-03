import { io } from "socket.io-client";

const VOICE_BACKEND_URL = "http://localhost:8000";

export const voiceSocket = io(VOICE_BACKEND_URL, {
    autoConnect: false,
    transports: ["websocket"],
});