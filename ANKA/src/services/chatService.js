import ollama from "ollama";

const SYSTEM_PROMPT = `
Tu es ANKA, un assistant IA local pour support technique et conversation. Réponds de manière concise et utile. Si l'utilisateur envoie des logs d'erreurs, fournis un diagnostic structuré; sinon, réponds de façon conversationnelle.
`;

export const chatWithLlama = async (message, history = []) => {
  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: message },
    ];

    const response = await ollama.chat({
      model: "llama3",
      messages,
      options: { temperature: 0.2 },
    });

    return response.message.content;
  } catch (error) {
    console.error("chatWithLlama error:", error);
    throw new Error("Failed to get response from Llama");
  }
};
