import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export function ChatWindow({ chat, isLoading }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-['Fira_Code'] text-sm text-[#00f2ff]/50">
          Select a chat to start
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-[#050510] to-[#0a0a15] overflow-hidden">
      {/* Chat Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <h2 className="font-['JetBrains_Mono'] text-lg font-bold text-[#00f2ff] tracking-widest">
          {chat.name}
        </h2>
        <p className="font-['Fira_Code'] text-xs text-[#8b5cf6]/50 mt-1">
          {chat.messages?.length || 0} messages
        </p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {!chat.messages || chat.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="font-['Fira_Code'] text-sm text-[#00f2ff]/50 text-center">
              No messages yet. Start a conversation or send a file.
            </p>
          </div>
        ) : (
          chat.messages.map((msg, idx) => (
            <motion.div
              key={msg.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-3 rounded-lg font-['Fira_Code'] text-sm ${
                  msg.role === "user"
                    ? "bg-[#8b5cf6]/30 border border-[#8b5cf6]/50 text-[#8b5cf6]"
                    : "bg-[#00f2ff]/20 border border-[#00f2ff]/50 text-[#00f2ff]"
                }`}
              >
                {msg.file ? (
                  <div className="space-y-2">
                    <p>{msg.content}</p>
                    <a
                      href={msg.file.url}
                      download
                      className="inline-block px-2 py-1 bg-white/10 rounded text-xs hover:bg-white/20"
                    >
                      📥 {msg.file.originalName}
                    </a>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
                <p className="text-xs mt-1 opacity-50">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          ))
        )}

        {isLoading && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex justify-start"
          >
            <div className="bg-[#00f2ff]/20 border border-[#00f2ff]/50 rounded-lg px-4 py-3">
              <p className="font-['Fira_Code'] text-sm text-[#00f2ff]">
                ANKA is thinking...
              </p>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
