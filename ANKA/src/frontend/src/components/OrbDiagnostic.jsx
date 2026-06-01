/**
 * OrbDiagnostic Component - Full Featured
 *
 * Senior-grade Sci-Fi/Cyberpunk UI with:
 * - Glassmorphism design
 * - Dynamic galactic orb animations
 * - Chat interface with message history
 * - Web Speech API microphone control
 * - Real-time system metrics
 * - Deep Navy + Cyan Neon + Electric Violet palette
 */

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const OrbDiagnostic = ({
  isDiagnostic = false,
  systemStatus = "IDLE",
  cpuUsage = 0,
  memoryUsage = 0,
  diagnosticMessage = "System ready for input",
  messages = [],
  input = "",
  isLoading = false,
  isListening = false,
  onInputChange = () => {},
  onSend = () => {},
  onKeyPress = () => {},
  onMicrophoneClick = () => {},
}) => {
  const [glowIntensity, setGlowIntensity] = useState(1);
  const messagesEndRef = useRef(null);

  // Enhanced glow effect when in diagnostic mode
  useEffect(() => {
    if (isDiagnostic) {
      const interval = setInterval(() => {
        setGlowIntensity((prev) => (prev === 1 ? 1.5 : 1));
      }, 1200);
      return () => clearInterval(interval);
    } else {
      setGlowIntensity(1);
    }
  }, [isDiagnostic]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const orbVariants = {
    idle: {
      scale: 1,
      opacity: 0.8,
    },
    diagnostic: {
      scale: [1, 1.05, 1],
      opacity: [0.8, 1, 0.8],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const orbColor = systemStatus === "ERROR" ? "#8b5cf6" : "#00f2ff";

  return (
    <div className="flex flex-col items-center justify-center gap-6 min-h-screen bg-gradient-to-b from-[#050510] to-[#0a0a15] p-4">
      {/* Main Glassmorphism Panel - Split Layout */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-4xl backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          boxShadow: `0 8px 32px rgba(0, 242, 255, ${0.08 * glowIntensity}), inset 0 1px 1px rgba(255, 255, 255, 0.1)`,
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
          {/* LEFT SIDE: Orb & System Metrics */}
          <div className="flex flex-col items-center justify-between">
            {/* Header: System Status */}
            <div className="w-full text-center mb-4">
              <h1 className="font-['JetBrains_Mono'] text-xl font-bold text-[#00f2ff] tracking-widest">
                ANKA
              </h1>
              <p className="font-['Fira_Code'] text-xs text-[#8b5cf6]/60 mt-1">
                v1.0 | A.T.I
              </p>
            </div>

            {/* Orb Section */}
            <div className="flex flex-col items-center justify-center my-8 relative">
              {/* Main Orb */}
              <motion.div
                variants={orbVariants}
                animate={isDiagnostic ? "diagnostic" : "idle"}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-[#00f2ff]/30 via-[#8b5cf6]/20 to-transparent relative"
                style={{
                  boxShadow: `
                    0 0 40px rgba(${systemStatus === "ERROR" ? "139, 92, 246" : "0, 242, 255"}, ${0.3 * glowIntensity}),
                    0 0 80px rgba(139, 92, 246, ${0.2 * glowIntensity}),
                    inset -20px -20px 40px rgba(0, 242, 255, 0.1),
                    inset 20px 20px 40px rgba(139, 92, 246, 0.05)
                  `,
                }}
              >
                {/* Inner Core */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-4 rounded-full border-2"
                  style={{
                    borderColor: `${orbColor}4d`,
                  }}
                />

                {/* Pulsing Center */}
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-10 rounded-full"
                  style={{
                    backgroundColor: orbColor,
                    boxShadow: `0 0 30px ${orbColor}cc`,
                  }}
                />
              </motion.div>

              {/* Diagnostic Message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="font-['Fira_Code'] text-xs text-[#00f2ff]/70 mt-8 text-center max-w-xs"
              >
                {diagnosticMessage}
              </motion.p>
            </div>

            {/* System Metrics */}
            <div className="w-full grid grid-cols-2 gap-3 mt-6">
              {/* CPU */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="backdrop-blur-md bg-white/5 border border-[#8b5cf6]/20 rounded-lg p-3"
              >
                <p className="font-['JetBrains_Mono'] text-xs text-[#8b5cf6]/60">
                  CPU
                </p>
                <p className="font-['JetBrains_Mono'] text-lg font-bold text-[#8b5cf6]">
                  {cpuUsage}%
                </p>
                <div className="w-full h-1 bg-[#8b5cf6]/10 rounded-full mt-1 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#00f2ff]"
                    animate={{ width: `${cpuUsage}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </motion.div>

              {/* Memory */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="backdrop-blur-md bg-white/5 border border-[#00f2ff]/20 rounded-lg p-3"
              >
                <p className="font-['JetBrains_Mono'] text-xs text-[#00f2ff]/60">
                  MEM
                </p>
                <p className="font-['JetBrains_Mono'] text-lg font-bold text-[#00f2ff]">
                  {memoryUsage}%
                </p>
                <div className="w-full h-1 bg-[#00f2ff]/10 rounded-full mt-1 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#00f2ff] to-[#8b5cf6]"
                    animate={{ width: `${memoryUsage}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </motion.div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <div
                className={`w-3 h-3 rounded-full ${
                  systemStatus === "ONLINE" ? "bg-[#00f2ff]" : "bg-[#8b5cf6]"
                }`}
                style={{
                  boxShadow:
                    systemStatus === "ONLINE"
                      ? "0 0 12px #00f2ff"
                      : systemStatus === "ERROR"
                        ? "0 0 12px #ff4444"
                        : "0 0 12px #8b5cf6",
                }}
              />
              <span className="font-['JetBrains_Mono'] text-xs text-[#00f2ff]">
                {systemStatus}
              </span>
            </div>
          </div>

          {/* RIGHT SIDE: Chat Interface */}
          <div className="flex flex-col h-96">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-3">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <p className="font-['Fira_Code'] text-xs text-[#00f2ff]/50">
                    Ready for input... Start speaking or type your command
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: msg.who === "user" ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${
                      msg.who === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg font-['Fira_Code'] text-xs ${
                        msg.who === "user"
                          ? "bg-[#8b5cf6]/30 border border-[#8b5cf6]/50 text-[#8b5cf6]"
                          : "bg-[#00f2ff]/20 border border-[#00f2ff]/50 text-[#00f2ff]"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="space-y-3 border-t border-white/10 pt-4">
              {/* Text Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyPress={onKeyPress}
                  placeholder="Type your command..."
                  disabled={isLoading}
                  className="flex-1 bg-white/5 border border-[#00f2ff]/30 rounded-lg px-4 py-2 font-['Fira_Code'] text-xs text-[#00f2ff] placeholder-[#00f2ff]/40 focus:outline-none focus:border-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onSend}
                  disabled={isLoading || !input.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-[#00f2ff] to-[#8b5cf6] rounded-lg font-['JetBrains_Mono'] text-xs font-bold text-[#050510] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "..." : "SEND"}
                </motion.button>
              </div>

              {/* Microphone Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onMicrophoneClick}
                disabled={isLoading}
                className={`w-full py-2 rounded-lg font-['JetBrains_Mono'] text-xs font-bold transition-colors ${
                  isListening
                    ? "bg-red-500/30 border border-red-500 text-red-400"
                    : "bg-[#00f2ff]/10 border border-[#00f2ff]/30 text-[#00f2ff] hover:bg-[#00f2ff]/20"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isListening ? "🎙️ LISTENING..." : "🎤 START VOICE"}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Diagnostic Badge */}
        {isDiagnostic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-4 right-4 flex items-center gap-2"
          >
            <div
              className="w-2 h-2 rounded-full bg-[#00f2ff]"
              style={{
                boxShadow: "0 0 8px #00f2ff",
              }}
            />
            <p className="font-['Fira_Code'] text-xs text-[#00f2ff] tracking-widest">
              PROCESSING
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center font-['JetBrains_Mono'] text-xs text-[#00f2ff]/40"
      >
        <p>ANKA Core Systems | Llama3 AI + Web Speech API</p>
        <p className="mt-1">
          Press Enter to send | Click mic for voice control
        </p>
      </motion.div>
    </div>
  );
};

export default OrbDiagnostic;
