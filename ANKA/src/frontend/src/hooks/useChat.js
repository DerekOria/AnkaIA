import { useState, useCallback } from "react";

export function useChat(initialChatId = "default") {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(initialChatId);
  const [currentChat, setCurrentChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar lista de chats
  const loadChats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chats");
      if (!res.ok) throw new Error("Failed to load chats");
      const data = await res.json();
      setChats(data.chats || []);
    } catch (err) {
      setError(err.message);
      console.error("Error loading chats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar chat específico
  const loadChat = useCallback(async (chatId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/chats/${chatId}`);
      if (!res.ok) throw new Error("Chat not found");
      const data = await res.json();
      setCurrentChat(data.chat);
      setCurrentChatId(chatId);
    } catch (err) {
      setError(err.message);
      console.error("Error loading chat:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear nuevo chat
  const createChat = useCallback(
    async (name) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error("Failed to create chat");
        const data = await res.json();
        setChats((prev) => [...prev, data.chat]);
        await loadChat(data.chat.id);
        return data.chat;
      } catch (err) {
        setError(err.message);
        console.error("Error creating chat:", err);
      } finally {
        setLoading(false);
      }
    },
    [loadChat],
  );

  // Enviar mensaje
  const sendMessage = useCallback(
    async (messageText, file = null) => {
      if (!currentChatId) {
        setError("No chat selected");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("message", messageText);
        if (file) {
          formData.append("file", file);
        }

        const res = await fetch(`/api/chats/${currentChatId}/messages`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Failed to send message");
        const data = await res.json();

        // Recargar el chat para obtener los nuevos mensajes
        await loadChat(currentChatId);

        return data;
      } catch (err) {
        setError(err.message);
        console.error("Error sending message:", err);
      } finally {
        setLoading(false);
      }
    },
    [currentChatId, loadChat],
  );

  return {
    chats,
    currentChatId,
    currentChat,
    loading,
    error,
    loadChats,
    loadChat,
    createChat,
    sendMessage,
    setCurrentChatId,
  };
}
