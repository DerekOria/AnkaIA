import asyncio
import os
import traceback

import pyaudio
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

FORMAT = pyaudio.paInt16
CHANNELS = 1

SEND_SAMPLE_RATE = 16000
RECEIVE_SAMPLE_RATE = 24000
CHUNK_SIZE = 1024

MODEL = "models/gemini-2.5-flash-native-audio-preview-12-2025"

SYSTEM_INSTRUCTION = """
You are ANKA, a real-time multilingual AI voice assistant.

You can speak and understand:
- English
- French
- Spanish
- Arabic 

Language rules:
- Always answer in the same language the user is currently speaking.
- If the user speaks English, answer in English.
- If the user speaks French, answer in French.
- If the user speaks Spanish, answer in Spanish.
- If the user mixes languages, answer mainly in the language used most in the last user message.
- Do not translate unless the user asks for translation.
- Do not force English by default.

Personality:
- Speak naturally and concisely.
- Be helpful, calm, and professional.
- Keep answers short unless the user asks for details.
- You help with technical support, programming, diagnostics, and normal conversation.
"""

pya = pyaudio.PyAudio()


class VoiceLoop:
    def __init__(self, on_status=None, on_transcription=None, on_error=None):
        self.on_status = on_status
        self.on_transcription = on_transcription
        self.on_error = on_error

        self.session = None
        self.audio_stream = None
        self.output_stream = None

        self.out_queue = asyncio.Queue()
        self.audio_in_queue = asyncio.Queue()

        self.stop_event = asyncio.Event()
        self.paused = False

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

    async def listen_microphone(self):
        try:
            mic_info = pya.get_default_input_device_info()

            self.audio_stream = await asyncio.to_thread(
                pya.open,
                format=FORMAT,
                channels=CHANNELS,
                rate=SEND_SAMPLE_RATE,
                input=True,
                input_device_index=mic_info["index"],
                frames_per_buffer=CHUNK_SIZE,
            )

            self.emit_status("listening", "Microphone is active")

            while not self.stop_event.is_set():
                if self.paused:
                    await asyncio.sleep(0.05)
                    continue

                data = await asyncio.to_thread(
                    self.audio_stream.read,
                    CHUNK_SIZE,
                    exception_on_overflow=False,
                )

                await self.out_queue.put(
                    {
                        "data": data,
                        "mime_type": "audio/pcm",
                    }
                )

        except asyncio.CancelledError:
            print("[VOICE] listen_microphone cancelled")
            raise

        except Exception as error:
            traceback.print_exc()
            self.emit_error(f"Microphone error: {error}")

    async def send_audio_to_model(self):
        try:
            while not self.stop_event.is_set():
                try:
                    msg = await asyncio.wait_for(
                        self.out_queue.get(),
                        timeout=0.1,
                    )

                    if self.session:
                        await self.session.send(input=msg, end_of_turn=False)

                except asyncio.TimeoutError:
                    continue

        except asyncio.CancelledError:
            print("[VOICE] send_audio_to_model cancelled")
            raise

        except Exception as error:
            traceback.print_exc()
            self.emit_error(f"Send audio error: {error}")

    async def receive_from_model(self):
        try:
            while not self.stop_event.is_set():
                if not self.session:
                    await asyncio.sleep(0.05)
                    continue

                turn = self.session.receive()

                async for response in turn:
                    if self.stop_event.is_set():
                        break

                    try:
                        server_content = getattr(response, "server_content", None)

                        if not server_content:
                            continue

                        input_transcription = getattr(
                            server_content,
                            "input_transcription",
                            None,
                        )

                        if input_transcription:
                            text = getattr(input_transcription, "text", None)
                            if text:
                                self.emit_transcription("user", text)

                        output_transcription = getattr(
                            server_content,
                            "output_transcription",
                            None,
                        )

                        if output_transcription:
                            text = getattr(output_transcription, "text", None)
                            if text:
                                self.emit_transcription("assistant", text)

                        model_turn = getattr(server_content, "model_turn", None)

                        if model_turn and getattr(model_turn, "parts", None):
                            for part in model_turn.parts:
                                inline_data = getattr(part, "inline_data", None)

                                if inline_data and inline_data.data:
                                    await self.audio_in_queue.put(inline_data.data)

                    except Exception as inner_error:
                        print(
                            f"[VOICE] Error while processing model response: {inner_error}"
                        )

        except asyncio.CancelledError:
            print("[VOICE] receive_from_model cancelled")
            raise

        except Exception as error:
            traceback.print_exc()
            self.emit_error(f"Receive audio error: {error}")

    async def play_audio(self):
        try:
            self.output_stream = await asyncio.to_thread(
                pya.open,
                format=FORMAT,
                channels=CHANNELS,
                rate=RECEIVE_SAMPLE_RATE,
                output=True,
            )

            self.emit_status("speaking_ready", "Speaker output is active")

            while not self.stop_event.is_set():
                try:
                    data = await asyncio.wait_for(
                        self.audio_in_queue.get(),
                        timeout=0.1,
                    )

                    await asyncio.to_thread(self.output_stream.write, data)

                except asyncio.TimeoutError:
                    continue

        except asyncio.CancelledError:
            print("[VOICE] play_audio cancelled")
            raise

        except Exception as error:
            traceback.print_exc()
            self.emit_error(f"Speaker error: {error}")

    async def run(self):
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is missing. Check src/voice-backend/.env"
            )

        client = genai.Client(
            http_options={"api_version": "v1beta"},
            api_key=api_key,
        )

        config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            input_audio_transcription={},
            output_audio_transcription={},
            system_instruction=SYSTEM_INSTRUCTION,
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name="Kore"
                    )
                )
            ),
        )

        self.emit_status("starting", "Connecting to Gemini Live")

        try:
            async with client.aio.live.connect(
                model=MODEL,
                config=config,
            ) as session:
                self.session = session
                self.emit_status("started", "Voice session connected to Gemini Live")

                tasks = [
                    asyncio.create_task(self.listen_microphone()),
                    asyncio.create_task(self.send_audio_to_model()),
                    asyncio.create_task(self.receive_from_model()),
                    asyncio.create_task(self.play_audio()),
                ]

                await self.stop_event.wait()

                for task in tasks:
                    task.cancel()

                await asyncio.gather(*tasks, return_exceptions=True)

        except asyncio.CancelledError:
            print("[VOICE] VoiceLoop run cancelled")
            raise

        except Exception as error:
            traceback.print_exc()
            self.emit_error(f"Voice loop error: {error}")

        finally:
            self.cleanup()
            self.emit_status("stopped", "Voice session stopped")

    def cleanup(self):
        try:
            if self.audio_stream:
                self.audio_stream.stop_stream()
                self.audio_stream.close()
        except Exception:
            pass

        try:
            if self.output_stream:
                self.output_stream.stop_stream()
                self.output_stream.close()
        except Exception:
            pass