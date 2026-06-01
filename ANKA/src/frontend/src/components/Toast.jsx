import React, { useEffect } from "react";
import { motion } from "framer-motion";

export function Toast({ message, type = "info", duration = 3000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: {
      bg: "bg-green-500/20",
      border: "border-green-500",
      text: "text-green-400",
    },
    error: {
      bg: "bg-red-500/20",
      border: "border-red-500",
      text: "text-red-400",
    },
    info: {
      bg: "bg-blue-500/20",
      border: "border-blue-500",
      text: "text-blue-400",
    },
    warning: {
      bg: "bg-yellow-500/20",
      border: "border-yellow-500",
      text: "text-yellow-400",
    },
  };

  const colorScheme = colors[type] || colors.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`${colorScheme.bg} border ${colorScheme.border} rounded-lg px-4 py-3 font-['Fira_Code'] text-sm ${colorScheme.text}`}
    >
      {message}
    </motion.div>
  );
}
