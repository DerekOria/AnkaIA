import React, { useState, useEffect, useRef } from "react";
import { useVoiceAssistant } from "./hooks/useVoiceAssistant";
import { ChatSidebar } from "./components/ChatSidebar";
import OrbDiagnostic from "./components/OrbDiagnostic";

function App() {
  const [cpuUsage, setCpuUsage] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [systemStatus, setSystemStatus] = useState("ONLINE");

  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDiagnostic, setIsDiagnostic] = useState(false);
  const [isVoiceStarting, setIsVoiceStarting] = useState(false);
  const [diagnosticMessage, setDiagnosticMessage] = useState(
    "System ready for input",
  );

  const {
    isVoiceRunning,
    voiceMessage,
    lastTranscription,
    startVoice,
    stopVoice,
  } = useVoiceAssistant();

  const systemStatusIntervalRef = useRef(null);
  const currentChatIdRef = useRef(null);

  useEffect(() => {
    currentChatIdRef.current = currentChatId;
  }, [currentChatId]);

  useEffect(() => {
    if (isVoiceRunning) {
      setIsVoiceStarting(false);
    }
  }, [isVoiceRunning]);

  function normalizeMessages(apiMessages = []) {
    return apiMessages.map((msg) => ({
      id: msg.id || `msg-${Date.now()}-${Math.random()}`,
      who: msg.role === "user" ? "user" : "ai",
      text: msg.content || "",
      timestamp: msg.timestamp,
      file: msg.file,
    }));
  }

  async function loadChats() {
    try {
      const response = await fetch("/api/chats");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to load chats");
      }

      setChats(data.chats || []);

      if (data.chats?.length > 0 && !currentChatIdRef.current) {
        await selectChat(data.chats[0].id);
      }
    } catch (error) {
      console.error("loadChats error:", error);
      setSystemStatus("ERROR");
    }
  }

  async function selectChat(chatId) {
    try {
      const response = await fetch(`/api/chats/${chatId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to load chat");
      }

      setCurrentChatId(chatId);
      setMessages(normalizeMessages(data.chat.messages || []));
    } catch (error) {
      console.error("selectChat error:", error);
      setSystemStatus("ERROR");
    }
  }

  async function createNewChat() {
    try {
      const chatName = `New Chat ${new Date().toLocaleTimeString()}`;

      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: chatName }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create chat");
      }

      await loadChats();
      await selectChat(data.chat.id);
    } catch (error) {
      console.error("createNewChat error:", error);
      setSystemStatus("ERROR");
    }
  }

  async function sendStreamingMessage(text) {
    const cleanText = text.trim();

    if (!cleanText || isLoading) return;

    if (!currentChatId) {
      console.warn("No current chat selected");
      return;
    }

    setIsLoading(true);
    setIsDiagnostic(true);
    setDiagnosticMessage("Streaming response...");

    const userMessage = {
      id: `temp-user-${Date.now()}`,
      who: "user",
      text: cleanText,
    };

    const aiMessageId = `stream-ai-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: aiMessageId,
        who: "ai",
        text: "",
      },
    ]);

    setInput("");

    try {
      const response = await fetch(
        `/api/chats/${currentChatId}/messages/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: cleanText,
          }),
        },
      );

      if (!response.ok || !response.body) {
        throw new Error("Streaming response failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? {
                  ...msg,
                  text: fullText,
                }
              : msg,
          ),
        );
      }

      setDiagnosticMessage("Response streamed");

      await loadChats();
    } catch (error) {
      console.error("sendStreamingMessage error:", error);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                text: "Erreur: impossible de streamer la réponse d'ANKA.",
              }
            : msg,
        ),
      );

      setSystemStatus("ERROR");
      setDiagnosticMessage("Streaming error");
    } finally {
      setIsLoading(false);
      setIsDiagnostic(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendStreamingMessage(input);
    }
  }

  useEffect(() => {
    if (!lastTranscription) return;

    const newMessage = {
      id: lastTranscription.id,
      who: lastTranscription.role === "user" ? "user" : "ai",
      text: lastTranscription.text,
      timestamp: lastTranscription.timestamp,
    };

    setMessages((prev) => [...prev, newMessage]);
  }, [lastTranscription]);

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const response = await fetch("/api/system-status");

        if (response.ok) {
          const data = await response.json();
          setCpuUsage(data.cpu);
          setMemoryUsage(data.memory);
          setSystemStatus(data.systemStatus || "ONLINE");
        }
      } catch (err) {
        setSystemStatus("ERROR");
      }
    };

    loadChats();
    fetchSystemStatus();

    systemStatusIntervalRef.current = setInterval(fetchSystemStatus, 1000);

    return () => {
      clearInterval(systemStatusIntervalRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  const voiceButtonActive = isVoiceRunning || isVoiceStarting;
  const displayedDiagnosticMessage =
    voiceMessage || diagnosticMessage || "System ready for input";

  return (
    <div className="flex h-screen bg-[#050510] text-[#00f2ff]">
      <div className="w-64 border-r border-white/10">
        <ChatSidebar
          chats={chats}
          currentChatId={currentChatId}
          loading={isLoading}
          onChatSelect={selectChat}
          onNewChat={createNewChat}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <OrbDiagnostic
          isDiagnostic={isDiagnostic}
          systemStatus={systemStatus}
          cpuUsage={cpuUsage}
          memoryUsage={memoryUsage}
          diagnosticMessage={displayedDiagnosticMessage}
          messages={messages}
          input={input}
          isLoading={isLoading}
          isListening={voiceButtonActive}
          onInputChange={setInput}
          onSend={() => sendStreamingMessage(input)}
          onKeyPress={handleKeyDown}
          onMicrophoneClick={() => {
            if (voiceButtonActive) {
              setIsVoiceStarting(false);
              stopVoice();
            } else {
              setIsVoiceStarting(true);
              setDiagnosticMessage("Starting ANKA voice mode...");
              startVoice(currentChatId);
            }
          }}
        />
      </div>
    </div>
  );
}

export default App;