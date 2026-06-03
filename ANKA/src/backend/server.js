import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ ANKA Backend server running on port ${PORT}`);
  console.log(`🧠 Ollama model: ${process.env.OLLAMA_MODEL || "llama3"}`);
});