import React, { useState, useEffect, useRef } from "react";
// Importa tus componentes necesarios
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatWindow } from "./components/ChatWindow";
import { ChatInput } from "./components/ChatInput";
import OrbDiagnostic from "./components/OrbDiagnostic";

function App() {
  // Estados unificados
  const [cpuUsage, setCpuUsage] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [systemStatus, setSystemStatus] = useState("ONLINE");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDiagnostic, setIsDiagnostic] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [diagnosticMessage, setDiagnosticMessage] = useState("System ready for input");

  const recognitionRef = useRef(null);
  const systemStatusIntervalRef = useRef(null);

  // 1. Inicializar Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "es-ES";
      
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        sendMessage(transcript);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
    
    // 2. Fetch system status
    const fetchSystemStatus = async () => {
      try {
        const response = await fetch("/api/system-status");
        if (response.ok) {
          const data = await response.json();
          setCpuUsage(data.cpu);
          setMemoryUsage(data.memory);
        }
      } catch (err) {
        setSystemStatus("ERROR");
      }
    };

    systemStatusIntervalRef.current = setInterval(fetchSystemStatus, 1000);

    return () => clearInterval(systemStatusIntervalRef.current);
  }, []);

  // 3. Lógica de envío
  const sendMessage = async (text) => {
    if (!text.trim()) return;
    setIsLoading(true);
    setMessages(prev => [...prev, { id: Date.now(), who: "user", text }]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { id: Date.now(), who: "ai", text: data.reply }]);
      
      // TTS
      const utterance = new SpeechSynthesisUtterance(data.reply);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#050510] text-[#00f2ff]">
      <div className="w-64 border-r border-white/10">
        <ChatSidebar
          chats={[]}
          loading={isLoading}
          onChatSelect={(id) => console.log("Cambiar a chat:", id)}
          onNewChat={() => console.log("Nuevo chat")}
        />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        <OrbDiagnostic 
          isDiagnostic={isDiagnostic}
          systemStatus={systemStatus}
          cpuUsage={cpuUsage}
          memoryUsage={memoryUsage}
          diagnosticMessage={diagnosticMessage}
          messages={messages}
          input={input}
          isLoading={isLoading}
          isListening={isListening}
          onInputChange={setInput}
          onSend={() => sendMessage(input)}
          onMicrophoneClick={() => recognitionRef.current?.start()}
        />
        
        {/* ChatInput recibe el manejador que causaba el error */}

      </div>
    </div>
  );
}

export default App;