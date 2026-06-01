import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileUploader } from "./FileUploader";
import { SpeechButton } from "./SpeechButton";
import { Toast } from "./Toast";

export function ChatInput({ onSendMessage, isLoading, onError }) {
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [toast, setToast] = useState(null);

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;

    try {
      await onSendMessage(input, selectedFile);
      setInput("");
      setSelectedFile(null);
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTranscript = (text) => {
    setInput(text);
    // Enviar automáticamente después de capturar voz
    setTimeout(() => {
      setInput(text);
      // Trigger send del mensaje
      onSendMessage(text, selectedFile).catch(() => {});
    }, 100);
  };

  const handleError = (errorMsg) => {
    setToast({ message: errorMsg, type: "warning" });
  };

  return (
    <div className="border-t border-white/10 p-6 bg-gradient-to-t from-[#0a0a15] to-transparent space-y-3">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* File Uploader */}
      <FileUploader onFileSelect={setSelectedFile} disabled={isLoading} />

      {/* Text Input */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message or speak..."
          disabled={isLoading}
          rows={3}
          className="flex-1 bg-white/5 border border-[#00f2ff]/30 rounded-lg px-4 py-3 font-['Fira_Code'] text-sm text-[#00f2ff] placeholder-[#00f2ff]/40 focus:outline-none focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]/50 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
        />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={isLoading || (!input.trim() && !selectedFile)}
          className="px-6 py-3 bg-gradient-to-r from-[#00f2ff] to-[#8b5cf6] rounded-lg font-['JetBrains_Mono'] text-xs font-bold text-[#050510] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed h-fit"
        >
          {isLoading ? "..." : "SEND"}
        </motion.button>
      </div>

      {/* Speech Button */}
      <SpeechButton
        onTranscript={handleTranscript}
        disabled={isLoading}
        onError={handleError}
      />
    </div>
  );
}
