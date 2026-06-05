import React from "react";
import { motion } from "framer-motion";

export function ChatSidebar({
  chats = [],
  currentChatId,
  onChatSelect,
  onDeleteChat,
  onNewChat,
  loading,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full bg-[#0a0a15] border-r border-white/10 flex flex-col p-4 gap-4"
    >
      {/* Header */}
      <div>
        <h2 className="font-['JetBrains_Mono'] text-lg font-bold text-[#00f2ff] tracking-widest">
          ANKA
        </h2>
        <p className="font-['Fira_Code'] text-xs text-[#8b5cf6]/60 mt-1">
          v3.0
        </p>
      </div>

      {/* New Chat Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onNewChat}
        disabled={loading}
        className="w-full py-2 px-4 bg-gradient-to-r from-[#00f2ff] to-[#8b5cf6] rounded-lg font-['JetBrains_Mono'] text-xs font-bold text-[#050510] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        + New Chat
      </motion.button>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-[#00f2ff]/0 via-[#00f2ff]/30 to-[#00f2ff]/0" />

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {loading && !chats.length ? (
          <div className="text-center py-8">
            <p className="font-['Fira_Code'] text-xs text-[#00f2ff]/50">
              Loading chats...
            </p>
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-8">
            <p className="font-['Fira_Code'] text-xs text-[#00f2ff]/50">
              No chats yet
            </p>
          </div>
        ) : (
          chats.map((chat) => (
            <motion.div
              key={chat.id}
              whileHover={{ x: 4 }}
              onClick={() => onChatSelect(chat.id)}
              className={`w-full text-left px-2 py-2 rounded-lg transition-all ${
                currentChatId === chat.id
                  ? "bg-[#00f2ff]/20 border border-[#00f2ff]/50 text-[#00f2ff]"
                  : "bg-white/5 border border-white/10 text-[#00f2ff]/70 hover:bg-white/10"
              }`}
            >
              <button
                  onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded-md transition-all"
                title="Delete chat"
                disabled={loading}>
                  X
                </button>

              <p className="font-['JetBrains_Mono'] text-xs font-bold truncate">
                {chat.name}
              </p>
              <p className="font-['Fira_Code'] text-xs text-[#8b5cf6]/50 mt-1">
                {chat.messageCount} messages
              </p>

              <button 
                onclick={() => onChatSelect(chat.id)

                }
              />

              
            </motion.div>
          ))
        )}
      </div>

      {/* Footer: System Info */}
      <div className="text-center border-t border-white/10 pt-4">
        <p className="font-['Fira_Code'] text-xs text-[#00f2ff]/40">
          ANKA AI System
        </p>
        <p className="font-['Fira_Code'] text-xs text-[#8b5cf6]/40">
          Dashboard v1.0
        </p>
      </div>
    </motion.div>
  );
}
