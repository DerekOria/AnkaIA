const chatEl = document.getElementById("chat");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic");

let recognizing = false;
let recognition = null;

function appendMessage(text, who = "ai") {
  const div = document.createElement("div");
  div.className = "message " + (who === "user" ? "user" : "ai");
  const pre = document.createElement("pre");
  pre.textContent = text;
  div.appendChild(pre);
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

async function sendMessage(text) {
  appendMessage(text, "user");
  inputEl.value = "";
  appendMessage("Pensando...", "ai");
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();
    // remove the 'Pensando...' placeholder
    const placeholders = Array.from(
      chatEl.querySelectorAll(".message.ai"),
    ).filter((n) => n.textContent.includes("Pensando"));
    placeholders.forEach((p) => p.remove());

    if (data.success) {
      appendMessage(data.reply, "ai");
      speakText(data.reply);
    } else {
      appendMessage("Error: " + (data.error || "unknown"), "ai");
    }
  } catch (err) {
    console.error(err);
    appendMessage("Network error", "ai");
  }
}

sendBtn.addEventListener("click", () => {
  const text = inputEl.value.trim();
  if (!text) return;
  sendMessage(text);
});

// Simple TTS using Web Speech API
function speakText(text) {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "es-ES";
  utter.rate = 1.0;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

// Web Speech API for STT (best-effort, browser support required)
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = "es-ES";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    recognizing = true;
    micBtn.textContent = "●";
    micBtn.style.color = "#ff6b6b";
  };
  recognition.onend = () => {
    recognizing = false;
    micBtn.textContent = "🎤";
    micBtn.style.color = "";
  };
  recognition.onresult = (e) => {
    const transcript = Array.from(e.results)
      .map((r) => r[0].transcript)
      .join("");
    inputEl.value = transcript;
    sendMessage(transcript);
  };

  micBtn.addEventListener("click", () => {
    if (recognizing) {
      recognition.stop();
      return;
    }
    try {
      recognition.start();
    } catch (e) {
      console.error(e);
    }
  });
} else {
  // No browser STT: disable mic and inform user
  micBtn.addEventListener("click", () => {
    alert(
      "Voice capture not supported in this browser. You can type your message instead, or enable server-side Whisper transcription (ask me to configure Whisper).",
    );
  });
}

// allow Enter to send
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

// Welcome message
appendMessage(
  "Hola — estoy listo. Presiona el micrófono o escribe para comenzar.",
  "ai",
);
