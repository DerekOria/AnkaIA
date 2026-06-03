import fs from "fs";
import path from "path";

const CHATS_FILE = path.join(
  process.cwd(),
  "src",
  "backend",
  "storage",
  "chats.json",
);

function getDefaultChatsData() {
  return {
    chats: [
      {
        id: "default",
        name: "General Chat",
        createdAt: new Date().toISOString(),
        messages: [],
      },
    ],
  };
}

export function loadChatsFromDisk() {
  try {
    if (!fs.existsSync(CHATS_FILE)) {
      const defaultData = getDefaultChatsData();
      saveChatsToDisk(defaultData);
      return defaultData;
    }

    const data = fs.readFileSync(CHATS_FILE, "utf-8");

    if (!data.trim()) {
      const defaultData = getDefaultChatsData();
      saveChatsToDisk(defaultData);
      return defaultData;
    }

    return JSON.parse(data);
  } catch (err) {
    console.error("Error loading chats:", err);
    return getDefaultChatsData();
  }
}

export function saveChatsToDisk(chatsData) {
  try {
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chatsData, null, 2));
    return true;
  } catch (err) {
    console.error("Error saving chats:", err);
    return false;
  }
}

export function getChatById(chatId) {
  const chatsData = loadChatsFromDisk();
  return chatsData.chats.find((chat) => chat.id === chatId);
}

export function createChat(name) {
  const chatsData = loadChatsFromDisk();

  const newChat = {
    id: `chat-${Date.now()}`,
    name,
    createdAt: new Date().toISOString(),
    messages: [],
  };

  chatsData.chats.push(newChat);
  saveChatsToDisk(chatsData);

  return newChat;
}

export function addMessageToChat(chatId, messageObject) {
  const chatsData = loadChatsFromDisk();
  const chat = chatsData.chats.find((chat) => chat.id === chatId);

  if (!chat) return false;

  chat.messages.push(messageObject);
  saveChatsToDisk(chatsData);

  return true;
}

export function updateMessageInChat(chatId, messageId, updates) {
  const chatsData = loadChatsFromDisk();
  const chat = chatsData.chats.find((chat) => chat.id === chatId);

  if (!chat) return false;

  const message = chat.messages.find((msg) => msg.id === messageId);

  if (!message) return false;

  Object.assign(message, updates);
  saveChatsToDisk(chatsData);

  return true;
}