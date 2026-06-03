import asyncio
import json
import os
import queue
import traceback

import pyaudio
from vosk import Model, KaldiRecognizer


class WakeListener:
    def __init__(self, wake_phrases=None, on_wake=None, on_status=None):
        self.wake_phrases = wake_phrases or [
            "hola anka",
            "hola anca",
            "ola anka",
            "ola anca",
            "hola hanka",
            "ola hanka",
            "hola blanca",
            "hola banca",
            "holanka",
            "hola anda",
            "hola anna",
        ]

        self.on_wake = on_wake
        self.on_status = on_status

        self.running = False
        self.paused = False

        self.sample_rate = 16000
        self.chunk_size = 4000

        self.audio_queue = queue.Queue()

        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_path = os.path.join(
            base_dir,
            "models",
            "vosk-model-small-es",
        )

        self.model = None
        self.recognizer = None

        self.pyaudio_instance = None
        self.stream = None

    def emit_status(self, status, message):
        if self.on_status:
            self.on_status(
                {
                    "status": status,
                    "message": message,
                }
            )

    def normalize_text(self, text):
        return (
            text.lower()
            .replace("á", "a")
            .replace("é", "e")
            .replace("í", "i")
            .replace("ó", "o")
            .replace("ú", "u")
            .replace("ü", "u")
            .replace("¿", "")
            .replace("?", "")
            .replace("!", "")
            .replace("¡", "")
            .replace(".", "")
            .replace(",", "")
            .replace(";", "")
            .replace(":", "")
            .replace("-", " ")
            .replace("_", " ")
            .strip()
        )

    def stop(self):
        self.running = False

    def pause(self):
        print("[WAKE] Offline wake listener paused")
        self.paused = True

    def resume(self):
        print("[WAKE] Offline wake listener resumed")
        self.paused = False

    def load_model(self):
        if not os.path.exists(self.model_path):
            raise RuntimeError(
                f"Vosk model not found at: {self.model_path}. "
                "Download a Spanish Vosk model and extract it there."
            )

        print(f"[WAKE] Loading Vosk model from: {self.model_path}")

        self.model = Model(self.model_path)
        self.recognizer = KaldiRecognizer(self.model, self.sample_rate)

        print("[WAKE] Vosk model loaded")

    def open_microphone(self):
        self.pyaudio_instance = pyaudio.PyAudio()

        self.stream = self.pyaudio_instance.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=self.sample_rate,
            input=True,
            frames_per_buffer=self.chunk_size,
        )

        self.stream.start_stream()

        print("[WAKE] Offline microphone stream started")

    def close_microphone(self):
        try:
            if self.stream:
                self.stream.stop_stream()
                self.stream.close()
                self.stream = None
        except Exception:
            pass

        try:
            if self.pyaudio_instance:
                self.pyaudio_instance.terminate()
                self.pyaudio_instance = None
        except Exception:
            pass

    def detect_wake_phrase(self, text):
        normalized = self.normalize_text(text)

        if not normalized:
            return False

        # Debug utile pendant les tests.
        # Tu peux le désactiver plus tard si la console devient trop chargée.
        print(f"[WAKE] Heard offline: {normalized}")

        # Matchs directs propres
        direct_wake_phrases = [
            "hola anka",
            "hola anca",
            "ola anka",
            "ola anca",
            "hola hanka",
            "ola hanka",
            "hola blanca",
            "hola banca",
            "holanka",
            "hola anda",
            "hola anna",
            "anka",
            "anca",
        ]

        if any(phrase in normalized for phrase in direct_wake_phrases):
            return True

        # Matchs incorrects fréquents avec Vosk.
        # Exemple réel de ton log: "uno nunca blanca"
        bad_vosk_matches = [
            "uno nunca blanca",
            "una nunca blanca",
            "no nunca blanca",
            "aunque blanca",
            "nunca blanca",
            "uno blanca",
            "una blanca",
            "no blanca",
            "uno anka",
            "una anka",
            "no anka",
            "uno anca",
            "una anca",
            "no anca",
            "un anka",
            "un anca",
            "un blanca",
            "una banca",
            "uno banca",
            "no banca",
            "nunca banca",
            "aunque banca",
        ]

        if any(phrase in normalized for phrase in bad_vosk_matches):
            return True

        # Détection flexible :
        # Si Vosk entend un mot proche du coeur du wake word
        # + un mot proche du début, on accepte.
        wake_core_words = [
            "anka",
            "anca",
            "blanca",
            "banca",
            "anda",
            "anna",
            "hanka",
        ]

        wake_prefix_words = [
            "hola",
            "ola",
            "uno",
            "una",
            "un",
            "no",
            "nunca",
            "aunque",
        ]

        has_core = any(word in normalized for word in wake_core_words)
        has_prefix = any(word in normalized for word in wake_prefix_words)

        if has_core and has_prefix:
            return True

        return False

    async def trigger_wake(self):
        print("[WAKE] Offline wake phrase detected: Hola Anka")

        self.emit_status(
            "wake_detected",
            "Hola Anka detected. Starting voice mode...",
        )

        self.paused = True

        if self.on_wake:
            await self.on_wake()

        await asyncio.sleep(1)

    async def run(self):
        self.running = True

        self.emit_status(
            "wake_listening",
            "Offline wake listener active. Say 'Hola Anka'.",
        )

        try:
            self.load_model()
            self.open_microphone()

            while self.running:
                if self.paused:
                    await asyncio.sleep(0.1)
                    continue

                data = await asyncio.to_thread(
                    self.stream.read,
                    self.chunk_size,
                    False,
                )

                if self.recognizer.AcceptWaveform(data):
                    result = json.loads(self.recognizer.Result())
                    text = result.get("text", "")

                    if self.detect_wake_phrase(text):
                        await self.trigger_wake()

                else:
                    partial = json.loads(self.recognizer.PartialResult())
                    partial_text = partial.get("partial", "")

                    if self.detect_wake_phrase(partial_text):
                        print("[WAKE] Offline partial wake phrase detected")
                        await self.trigger_wake()

        except asyncio.CancelledError:
            print("[WAKE] Offline wake listener cancelled")
            raise

        except Exception as error:
            traceback.print_exc()
            self.emit_status("wake_error", f"Offline wake listener error: {error}")

        finally:
            self.close_microphone()
            self.emit_status("wake_stopped", "Offline wake listener stopped")