import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

export function SpeechButton({ onTranscript, disabled = false, onError }) {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      if (onError)
        onError("Speech Recognition API not supported in your browser");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = "es-ES";
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");

      if (onTranscript) {
        onTranscript(transcript);
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (onError) onError(`Speech error: ${event.error}`);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript, onError]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Error starting recognition:", error);
        if (onError) onError("Could not start microphone");
      }
    }
  };

  if (!isSupported) {
    return (
      <button
        disabled
        className="w-full py-2 rounded-lg font-['JetBrains_Mono'] text-xs bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#8b5cf6]/50 cursor-not-allowed"
        title="Speech Recognition not supported"
      >
        🎤 Voice not supported
      </button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={toggleListening}
      disabled={disabled}
      className={`w-full py-2 rounded-lg font-['JetBrains_Mono'] text-xs font-bold transition-colors ${
        isListening
          ? "bg-red-500/30 border border-red-500 text-red-400"
          : "bg-[#00f2ff]/10 border border-[#00f2ff]/30 text-[#00f2ff] hover:bg-[#00f2ff]/20"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isListening ? "🎙️ LISTENING..." : "🎤 START VOICE"}
    </motion.button>
  );
}
