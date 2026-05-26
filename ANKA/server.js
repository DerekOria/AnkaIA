import express from 'express';
import { analyzeErrorLog } from './services/ollamaService.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para poder recibir JSON en el cuerpo de las peticiones
app.use(express.json());

// Ruta principal para el análisis de errores (Objetivo 2 de tu MVP)
app.post('/analyze', async (req, res) => {
  const { error_log } = req.body;

  if (!error_log) {
    return res.status(400).json({ error: "Le champ 'error_log' est requis." });
  }

  try {
    // Invocamos el servicio que habla con Llama 3
    const rawAiResponse = await analyzeErrorLog(error_log);
    
    // Como Llama 3 responde JSON puro, lo parseamos directamente a un objeto JS
    const structuredDiagnostic = JSON.parse(rawAiResponse);
    
    // Enviamos el resultado estructurado de vuelta al cliente
    return res.json({
      success: true,
      diagnostic: structuredDiagnostic
    });
  } catch (error) {
    console.error("Erreur sur la route /analyze:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Erreur interne lors du traitement du diagnostic." 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 ANKA Backend fonctionnel sur http://localhost:${PORT}`);
});