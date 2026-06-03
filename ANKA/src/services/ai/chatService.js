import ollama from "ollama";

const MODEL_NAME = process.env.OLLAMA_MODEL || "llama3";

const SYSTEM_PROMPT = `
Tu es ANKA, un assistant IA local pour support technique et conversation.

Ton rôle:
- aider l'utilisateur de façon claire et concise
- diagnostiquer les erreurs informatiques
- expliquer les problèmes étape par étape
- répondre naturellement dans la langue de l'utilisateur
- garder un ton professionnel, utile et direct

Si l'utilisateur envoie des logs d'erreurs:
- explique la cause probable
- donne des étapes concrètes
- évite les réponses vagues

Si l'utilisateur parle normalement:
- réponds de façon conversationnelle
- ne fais pas de longs textes inutilement
`;

function normalizeHistory(history = []) {
  return history
    .filter((msg) => msg && msg.content)
    .map((msg) => ({
      role: msg.role === "ai" ? "assistant" : msg.role,
      content: msg.content,
    }))
    .filter((msg) => msg.role === "user" || msg.role === "assistant");
}

export async function chatWithLlama(message, history = []) {
  if (!message || !message.trim()) {
    throw new Error("Message is required");
  }

  try {
    const cleanHistory = normalizeHistory(history);

    const messages = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      ...cleanHistory,
      {
        role: "user",
        content: message,
      },
    ];

    const response = await ollama.chat({
      model: MODEL_NAME,
      messages,
      options: {
        temperature: 0.2,
      },
    });

    const aiText = response?.message?.content;

    if (!aiText) {
      throw new Error("Empty response from Ollama");
    }

    return aiText;
  } catch (error) {
    console.error("[chatWithLlama error]", error);

    throw new Error(
      "ANKA failed to get a response from the local AI model. Make sure Ollama is running and the model is installed.",
    );
  }
}

export async function streamChatWithLlama(message, history = [], onChunk) {
  if (!message || !message.trim()) {
    throw new Error("Message is required");
  }

  try {
    const cleanHistory = normalizeHistory(history);

    const messages = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      ...cleanHistory,
      {
        role: "user",
        content: message,
      },
    ];

    const stream = await ollama.chat({
      model: MODEL_NAME,
      messages,
      stream: true,
      options: {
        temperature: 0.2,
      },
    });

    let fullText = "";

    for await (const part of stream) {
      const chunk = part?.message?.content || "";

      if (chunk) {
        fullText += chunk;
        onChunk(chunk);
      }
    }

    return fullText;
  } catch (error) {
    console.error("[streamChatWithLlama error]", error);

    throw new Error(
      "ANKA failed to stream a response from the local AI model.",
    );
  }
}