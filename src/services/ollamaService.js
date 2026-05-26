import ollama from 'ollama';

// Definimos el System Prompt que validamos con éxito en la consola
const ANKA_SYSTEM_PROMPT = `
Tu es ANKA, un assistant IA local de support technique. Tu reçois une erreur système et tu dois y répondre UNIQUEMENT sous la forme d'un objet JSON brut, sans blocs de code Markdown (pas de \`\`\`json), sans salutations et sans notes à la fin.

Le format JSON doit être exactement le suivant :
{
  "error_type": "Nom de l'erreur ou ID",
  "cause": "Explication claire en une phrase",
  "steps": [
    "Étape 1 pour résoudre le problème",
    "Étape 2 pour résoudre le problème"
  ]
}
`;

export const analyzeErrorLog = async (errorMessage) => {
  try {
    const response = await ollama.chat({
      model: 'llama3',
      messages: [
        { role: 'system', content: ANKA_SYSTEM_PROMPT },
        { role: 'user', content: errorMessage }
      ],
      options: {
        temperature: 0.2 // Baja temperatura para mantener las respuestas estables y precisas
      }
    });

    // Retornamos el contenido textual que viene del modelo (que debería ser el JSON puro)
    return response.message.content;
  } catch (error) {
    console.error('Erreur lors de la communication avec Ollama:', error);
    throw new Error('Impossible de générer le diagnostic local.');
  }
};