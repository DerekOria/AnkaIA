import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

export function FileUploader({ onFileSelect, disabled = false }) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "audio/mpeg",
      "audio/wav",
      "audio/webm",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "File type not supported. Please use images, PDF, text, or audio files.",
      );
      return;
    }

    setSelectedFile(file);

    // Crear preview si es imagen
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }

    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        accept="image/*,.pdf,.txt,audio/*"
      />

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="flex items-center justify-center gap-2 py-2 px-4 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-lg text-[#8b5cf6] hover:bg-[#8b5cf6]/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        📎
        <span className="font-['Fira_Code'] text-xs">
          {selectedFile ? `${selectedFile.name}` : "Attach File"}
        </span>
      </motion.button>

      {/* File Preview */}
      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white/5 border border-[#00f2ff]/30 rounded-lg p-3"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-40 rounded max-w-full"
            />
          ) : (
            <div className="flex items-center gap-2 text-[#00f2ff]/70">
              <span className="text-2xl">📄</span>
              <div>
                <p className="font-['Fira_Code'] text-xs font-bold text-[#00f2ff]">
                  {selectedFile.name}
                </p>
                <p className="font-['Fira_Code'] text-xs text-[#00f2ff]/50">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          )}

          <button
            onClick={clearFile}
            className="absolute top-1 right-1 bg-red-500/30 border border-red-500 rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/50"
          >
            ✕
          </button>
        </motion.div>
      )}
    </div>
  );
}
