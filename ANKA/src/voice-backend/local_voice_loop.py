import asyncio
import os
import tempfile
import traceback

import numpy as np
import pyttsx3
import requests
import sounddevice as sd
from scipy.io.wavfile import write
from faster_whisper import WhisperModel


SAMPLE_RATE = 16000
RECORD_SECONDS = 5

LOCAL_SYSTEM_PROMPT = """
You are ANKA, a local offline AI assistant.

Rules:
- Answer in the same language as the user.
- If the user speaks French, answer in French.
- If the user speaks English, answer in English.
- If the user speaks Spanish, answer in Spanish.
- Keep answers short and useful.
- You can help with technical support, programming, terminal errors, and normal conversation.
- You are running in offline fallback mode, so you cannot browse the internet.
"""


class LocalVoiceLoop:
    def __init__(self, on_status=None, on_transcription=None, on_error=None):
        self.on_status = on_status
        self.on_transcription = on_transcription
        self.on_error = on_error

        self.stop_event = asyncio.Event()
        self.paused = False
        self.processing = False

        self.whisper_model = None

        self.ollama_url = os.getenv(
            "OLLAMA_URL",
            "http://localhost:11434/api/generate",
        )

        self.ollama_model = os.getenv(
            "OLLAMA_MODEL",
            "llama3.2:3b",
        )

        # tiny = faster, base = better, small = better but slower
        self.whisper_size = os.getenv(
            "LOCAL_WHISPER_MODEL",
            "base",
        )

    def emit_status(self, status, message):
        if self.on_status:
            self.on_status(
                {
                    "status": status,
                    "message": message,
                }
            )

    def emit_transcription(self, role, text):
        if self.on_transcription:
            self.on_transcription(
                {
                    "role": role,
                    "text": text,
                }
            )

    def emit_error(self, message):
        if self.on_error:
            self.on_error(message)

    def stop(self):
        self.stop_event.set()

    def set_paused(self, paused: bool):
        self.paused = paused

    def load_whisper_model(self):
        print(f"[LOCAL VOICE] Loading faster-whisper model: {self.whisper_size}")

        self.whisper_model = WhisperModel(
            self.whisper_size,
            device="cpu",
            compute_type="int8",
        )

        print("[LOCAL VOICE] faster-whisper model loaded")

    def record_audio_to_temp_file(self):
        print("[LOCAL VOICE] Recording audio...")

        audio = sd.rec(
            int(RECORD_SECONDS * SAMPLE_RATE),
            samplerate=SAMPLE_RATE,
            channels=1,
            dtype="float32",
        )

        sd.wait()

        audio = np.squeeze(audio)

        temp_file = tempfile.NamedTemporaryFile(
            suffix=".wav",
            delete=False,
        )

        temp_file.close()

        write(temp_file.name, SAMPLE_RATE, audio)

        return temp_file.name

    def transcribe_audio(self, audio_path):
        segments, info = self.whisper_model.transcribe(
            audio_path,
            beam_size=5,
            vad_filter=True,
        )

        text_parts = []

        for segment in segments:
            if segment.text:
                text_parts.append(segment.text.strip())

        text = " ".join(text_parts).strip()

        if text:
            print(f"[LOCAL VOICE] Detected language: {info.language}")

        return text

    def ask_ollama(self, user_text):
        prompt = f"""
{LOCAL_SYSTEM_PROMPT}

User:
{user_text}

ANKA:
"""

        response = requests.post(
            self.ollama_url,
            json={
                "model": self.ollama_model,
                "prompt": prompt,
                "stream": False,
            },
            timeout=120,
        )

        response.raise_for_status()

        data = response.json()
        answer = data.get("response", "").strip()

        if not answer:
            return "I could not generate a local response."

        return answer

    def speak(self, text):
        engine = None

        try:
            engine = pyttsx3.init()
            engine.setProperty("rate", 175)
            engine.say(text)
            engine.runAndWait()

        finally:
            if engine:
                try:
                    engine.stop()
                except Exception:
                    pass

    async def process_one_turn(self):
        if self.processing:
            return

        self.processing = True

        audio_path = None

        try:
            self.emit_status(
                "listening",
                "Local offline microphone is listening...",
            )

            audio_path = await asyncio.to_thread(self.record_audio_to_temp_file)

            if self.stop_event.is_set():
                return

            self.emit_status(
                "thinking",
                "Transcribing locally with Whisper...",
            )

            user_text = await asyncio.to_thread(
                self.transcribe_audio,
                audio_path,
            )

            if not user_text:
                self.emit_status(
                    "listening",
                    "I did not hear anything. Listening again...",
                )
                return

            print(f"[LOCAL VOICE] User said: {user_text}")

            self.emit_transcription("user", user_text)

            self.emit_status(
                "thinking",
                "ANKA local mode is thinking...",
            )

            answer = await asyncio.to_thread(self.ask_ollama, user_text)

            print(f"[LOCAL VOICE] ANKA: {answer}")

            self.emit_transcription("assistant", answer)

            self.emit_status(
                "speaking",
                "ANKA local mode is speaking...",
            )

            await asyncio.to_thread(self.speak, answer)

        except Exception as error:
            traceback.print_exc()
            self.emit_error(
                f"Local offline voice error: {error}. "
                "Make sure Ollama is installed and running."
            )

        finally:
            if audio_path:
                try:
                    os.remove(audio_path)
                except Exception:
                    pass

            self.processing = False

    async def run(self):
        self.emit_status(
            "offline_mode",
            "Offline voice mode active. Using Whisper + Ollama + local TTS.",
        )

        try:
            self.load_whisper_model()

            self.emit_status(
                "listening",
                "Local offline microphone is active",
            )

            while not self.stop_event.is_set():
                if self.paused:
                    await asyncio.sleep(0.1)
                    continue

                await self.process_one_turn()

                await asyncio.sleep(0.2)

        except asyncio.CancelledError:
            print("[LOCAL VOICE] LocalVoiceLoop cancelled")
            raise

        except Exception as error:
            traceback.print_exc()
            self.emit_error(f"Local voice loop error: {error}")

        finally:
            self.emit_status("stopped", "Local voice session stopped")