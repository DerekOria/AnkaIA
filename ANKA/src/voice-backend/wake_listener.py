import asyncio
import speech_recognition as sr


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

        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()

        self.running = False
        self.paused = False

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
            .replace("¿", "")
            .replace("?", "")
            .replace("!", "")
            .replace("¡", "")
            .strip()
        )

    def stop(self):
        self.running = False

    def pause(self):
        print("[WAKE] Wake listener paused")
        self.paused = True

    def resume(self):
        print("[WAKE] Wake listener resumed")
        self.paused = False

    async def run(self):
        self.running = True

        self.emit_status(
            "wake_listening",
            "Wake listener active. Say 'Hola Anka'.",
        )

        try:
            with self.microphone as source:
                print("[WAKE] Calibrating microphone noise...")
                self.recognizer.adjust_for_ambient_noise(source, duration=0.8)
                print("[WAKE] Calibration done")
        except Exception as error:
            self.emit_status("wake_error", f"Wake mic calibration error: {error}")

        while self.running:
            if self.paused:
                await asyncio.sleep(0.2)
                continue

            try:
                text = await asyncio.to_thread(self.listen_once)

                if not text:
                    continue

                normalized = self.normalize_text(text)

                print(f"[WAKE] Heard: {normalized}")

                wake_detected = any(
                    phrase in normalized for phrase in self.wake_phrases
                )

                if wake_detected:
                    print("[WAKE] Wake phrase detected: Hola Anka")

                    self.emit_status(
                        "wake_detected",
                        "Hola Anka detected. Starting voice mode...",
                    )

                    if self.on_wake:
                        await self.on_wake()

                    await asyncio.sleep(1)

            except asyncio.CancelledError:
                print("[WAKE] Wake listener cancelled")
                raise

            except Exception as error:
                print(f"[WAKE] Error: {error}")
                await asyncio.sleep(1)

    def listen_once(self):
        with self.microphone as source:
            audio = self.recognizer.listen(
                source,
                timeout=3,
                phrase_time_limit=3,
            )

        try:
            return self.recognizer.recognize_google(
                audio,
                language="es-ES",
            )
        except sr.UnknownValueError:
            return ""
        except sr.WaitTimeoutError:
            return ""
        except sr.RequestError as error:
            print(f"[WAKE] Google speech recognition error: {error}")
            return ""