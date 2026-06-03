import { useEffect, useState } from "react";
import { voiceSocket } from "../services/voiceSocket";

export function useVoiceAssistant() {
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isVoiceRunning, setIsVoiceRunning] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("disconnected");
  const [voiceMessage, setVoiceMessage] = useState("");
  const [lastTranscription, setLastTranscription] = useState(null);
  const [voiceError, setVoiceError] = useState(null);

  useEffect(() => {
    function handleConnect() {
      setIsVoiceConnected(true);
      setVoiceStatus("connected");
    }

    function handleDisconnect() {
      setIsVoiceConnected(false);
      setIsVoiceRunning(false);
      setVoiceStatus("disconnected");
    }

    function handleVoiceStatus(data) {
      setVoiceStatus(data.status);
      setVoiceMessage(data.message || "");

      if (
        data.status === "started" ||
        data.status === "listening" ||
        data.status === "speaking_ready"
      ) {
        setIsVoiceRunning(true);
      }

      if (data.status === "stopped") {
        setIsVoiceRunning(false);
      }
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

    function handleVoiceError(data) {
      console.error("[VOICE ERROR]", data);
      setVoiceError(data?.message || "Voice backend error");
      setVoiceMessage(data?.message || "Voice backend error");
    }

    voiceSocket.on("connect", handleConnect);
    voiceSocket.on("disconnect", handleDisconnect);
    voiceSocket.on("voice_status", handleVoiceStatus);
    voiceSocket.on("voice_transcription", handleTranscription);
    voiceSocket.on("voice_error", handleVoiceError);

    return () => {
      voiceSocket.off("connect", handleConnect);
      voiceSocket.off("disconnect", handleDisconnect);
      voiceSocket.off("voice_status", handleVoiceStatus);
      voiceSocket.off("voice_transcription", handleTranscription);
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

    setTimeout(() => {
      voiceSocket.emit("start_voice", {
        chatId: currentChatId,
      });
    }, 300);
  }

  function stopVoice() {
    voiceSocket.emit("stop_voice");
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
    voiceStatus,
    voiceMessage,
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