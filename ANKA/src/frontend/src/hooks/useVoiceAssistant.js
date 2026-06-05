import { useEffect, useState } from "react";
import { voiceSocket } from "../services/voiceSocket";

export function useVoiceAssistant() {
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isVoiceRunning, setIsVoiceRunning] = useState(false);
  const [isWakeListening, setIsWakeListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("disconnected");
  const [voiceMessage, setVoiceMessage] = useState("");
  const [lastTranscription, setLastTranscription] = useState(null);
  const [voiceError, setVoiceError] = useState(null);
  const [voiceMode, setVoiceMode] = useState("unknown");

  useEffect(() => {
    function handleConnect() {
      console.log("[VOICE SOCKET] Connected");

      setIsVoiceConnected(true);
      setVoiceStatus("connected");
      setVoiceMessage("Connected to ANKA Voice Backend");
    }

    function handleDisconnect() {
      console.log("[VOICE SOCKET] Disconnected");

      setIsVoiceConnected(false);
      setIsVoiceRunning(false);
      setIsWakeListening(false);
      setVoiceStatus("disconnected");
      setVoiceMessage("Disconnected from ANKA Voice Backend");
      setVoiceMode("unknown");
    }

    function handleVoiceStatus(data) {
      console.log("[VOICE STATUS]", data);

      const status = data?.status || "unknown";
      const message = data?.message || "";

      setVoiceStatus(status);
      setVoiceMessage(message);

      if (status === "online_mode") {
        setVoiceMode("online");
        setIsWakeListening(false);
        setIsVoiceRunning(true);
        return;
      }

      if (status === "offline_mode") {
        setVoiceMode("offline");
        setIsWakeListening(false);
        setIsVoiceRunning(true);
        return;
      }

      if (status === "wake_listening") {
        setIsWakeListening(true);
        setIsVoiceRunning(false);
        return;
      }

      if (status === "wake_detected") {
        setIsWakeListening(false);
        setIsVoiceRunning(true);
        return;
      }

      if (
        status === "starting" ||
        status === "started" ||
        status === "listening" ||
        status === "speaking_ready" ||
        status === "already_running" ||
        status === "resumed" ||
        status === "tool_executed" ||
        status === "thinking" ||
        status === "speaking"
      ) {
        setIsWakeListening(false);
        setIsVoiceRunning(true);
        return;
      }

      // wake_stopped only means Vosk wake mode stopped.
      // It does not necessarily mean Gemini/local voice mode stopped.
      if (status === "wake_stopped") {
        setIsWakeListening(false);
        return;
      }

      if (status === "stopped") {
        setIsVoiceRunning(false);
        return;
      }

      if (status === "paused") {
        setIsVoiceRunning(true);
        return;
      }

      if (status === "error" || status === "wake_error") {
        setIsVoiceRunning(false);
        setIsWakeListening(false);
      }
    }

    function handleWakeDetected(data) {
      console.log("[WAKE DETECTED]", data);

      setVoiceStatus("wake_detected");
      setVoiceMessage(data?.message || "Hola Anka detected");
      setIsWakeListening(false);
      setIsVoiceRunning(true);
    }

    function handleTranscription(data) {
      console.log("[VOICE TRANSCRIPTION]", data);

      if (!data?.text?.trim()) return;

      setLastTranscription({
        id: `voice-${Date.now()}-${Math.random()}`,
        role: data.role,
        text: data.text,
        timestamp: new Date().toISOString(),
      });
    }

    function handleToolResult(data) {
      console.log("[TOOL RESULT]", data);

      if (data?.message) {
        setVoiceMessage(data.message);
      }

      setVoiceStatus("tool_executed");
      setIsWakeListening(false);
      setIsVoiceRunning(true);
    }

    function handleVoiceError(data) {
      console.error("[VOICE ERROR]", data);

      setVoiceError(data?.message || "Voice backend error");
      setVoiceMessage(data?.message || "Voice backend error");
      setIsVoiceRunning(false);
      setIsWakeListening(false);
    }

    voiceSocket.on("connect", handleConnect);
    voiceSocket.on("disconnect", handleDisconnect);
    voiceSocket.on("voice_status", handleVoiceStatus);
    voiceSocket.on("wake_detected", handleWakeDetected);
    voiceSocket.on("voice_transcription", handleTranscription);
    voiceSocket.on("tool_result", handleToolResult);
    voiceSocket.on("voice_error", handleVoiceError);

    if (!voiceSocket.connected) {
      voiceSocket.connect();
    }

    return () => {
      voiceSocket.off("connect", handleConnect);
      voiceSocket.off("disconnect", handleDisconnect);
      voiceSocket.off("voice_status", handleVoiceStatus);
      voiceSocket.off("wake_detected", handleWakeDetected);
      voiceSocket.off("voice_transcription", handleTranscription);
      voiceSocket.off("tool_result", handleToolResult);
      voiceSocket.off("voice_error", handleVoiceError);
    };
  }, []);

  function connectVoice() {
    if (!voiceSocket.connected) {
      voiceSocket.connect();
    }
  }

  function disconnectVoice() {
    if (voiceSocket.connected) {
      voiceSocket.disconnect();
    }
  }

  function startVoice(currentChatId) {
    connectVoice();

    setIsWakeListening(false);
    setIsVoiceRunning(true);
    setVoiceStatus("starting");
    setVoiceMessage("Starting ANKA voice mode...");

    setTimeout(() => {
      voiceSocket.emit("start_voice", {
        chatId: currentChatId,
      });
    }, 300);
  }

  function stopVoice() {
    voiceSocket.emit("stop_voice");

    setIsVoiceRunning(false);
    setVoiceStatus("stopped");
    setVoiceMessage("Voice session stopped. Say 'Hola Anka' to wake me.");
  }

  function pauseVoice() {
    voiceSocket.emit("pause_voice");
  }

  function resumeVoice() {
    voiceSocket.emit("resume_voice");
  }

  return {
    isVoiceConnected,
    isVoiceRunning,
    isWakeListening,
    voiceStatus,
    voiceMessage,
    voiceMode,
    lastTranscription,
    voiceError,
    connectVoice,
    disconnectVoice,
    startVoice,
    stopVoice,
    pauseVoice,
    resumeVoice,
  };
}