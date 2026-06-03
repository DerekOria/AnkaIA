import os
import asyncio
import socketio
import uvicorn
from fastapi import FastAPI
from dotenv import load_dotenv

from wake_listener import WakeListener
from voice_loop import VoiceLoop
from command_router import CommandRouter

load_dotenv()

VOICE_BACKEND_PORT = int(os.getenv("VOICE_BACKEND_PORT", 8000))

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
)

app = FastAPI()
socket_app = socketio.ASGIApp(sio, app)

voice_loop = None
voice_task = None

wake_listener = None
wake_task = None

connected_sid = None
restarting_wake = False

command_router = CommandRouter()


@app.get("/status")
async def status():
    return {
        "success": True,
        "service": "ANKA Voice Backend",
        "status": "running",
        "voice_running": voice_task is not None and not voice_task.done(),
        "wake_running": wake_task is not None and not wake_task.done(),
    }


@sio.event
async def connect(sid, environ):
    global connected_sid

    connected_sid = sid

    print(f"[VOICE] Client connected: {sid}")

    await sio.emit(
        "voice_status",
        {
            "status": "connected",
            "message": "Connected to ANKA Voice Backend",
        },
        room=sid,
    )

    await start_wake_listener(sid)


@sio.event
async def disconnect(sid):
    global connected_sid

    print(f"[VOICE] Client disconnected: {sid}")

    if connected_sid == sid:
        connected_sid = None


async def stop_wake_listener():
    global wake_listener, wake_task

    if wake_listener:
        print("[WAKE] Stopping wake listener...")
        wake_listener.stop()

    if wake_task and not wake_task.done():
        wake_task.cancel()

        try:
            await wake_task
        except asyncio.CancelledError:
            print("[WAKE] Wake task cancelled successfully")
        except Exception as error:
            print(f"[WAKE] Error while stopping wake task: {error}")

    wake_listener = None
    wake_task = None

    print("[WAKE] Wake listener fully stopped")


async def start_wake_listener(sid=None):
    global wake_listener, wake_task, connected_sid, restarting_wake

    target_sid = sid or connected_sid

    if not target_sid:
        print("[WAKE] Cannot start wake listener: no connected client")
        return

    if voice_task and not voice_task.done():
        print("[WAKE] Voice is running, wake listener will not start")
        return

    if wake_task and not wake_task.done():
        print("[WAKE] Wake listener already running")
        return

    if restarting_wake:
        print("[WAKE] Wake listener restart already in progress")
        return

    restarting_wake = True

    try:
        await asyncio.sleep(0.8)

        if voice_task and not voice_task.done():
            print("[WAKE] Voice started during delay, wake listener cancelled")
            return

        async def on_wake():
            print("[WAKE] on_wake triggered")

            await sio.emit(
                "wake_detected",
                {
                    "message": "Hola Anka detected",
                },
                room=target_sid,
            )

            await sio.emit(
                "voice_status",
                {
                    "status": "wake_detected",
                    "message": "Hola Anka detected. Starting ANKA voice mode...",
                },
                room=target_sid,
            )

            await start_voice_internal(target_sid, started_by_wake=True)

        def on_wake_status(payload):
            asyncio.create_task(
                sio.emit(
                    "voice_status",
                    payload,
                    room=target_sid,
                )
            )

        wake_listener = WakeListener(
            on_wake=on_wake,
            on_status=on_wake_status,
        )

        wake_task = asyncio.create_task(wake_listener.run())

        print("[WAKE] Wake listener started")

    finally:
        restarting_wake = False


async def start_voice_internal(sid, started_by_wake=False):
    global voice_loop, voice_task

    if voice_task and not voice_task.done():
        await sio.emit(
            "voice_status",
            {
                "status": "already_running",
                "message": "Voice session is already running",
            },
            room=sid,
        )
        return

    if voice_task and voice_task.done():
        voice_loop = None
        voice_task = None

    # Critical: fully stop Vosk so Gemini can take the microphone.
    await stop_wake_listener()

    def on_status(payload):
        asyncio.create_task(
            sio.emit(
                "voice_status",
                payload,
                room=sid,
            )
        )

    def on_transcription(payload):
        async def handle_transcription():
            await sio.emit(
                "voice_transcription",
                payload,
                room=sid,
            )

            role = payload.get("role")
            text = payload.get("text", "")

            if role != "user":
                return

            result = command_router.detect_and_execute(text)

            if not result:
                return

            tool_payload = {
                "command": result.get("command"),
                "success": result.get("success", False),
                "message": result.get("message", ""),
            }

            await sio.emit(
                "tool_result",
                tool_payload,
                room=sid,
            )

            await sio.emit(
                "voice_transcription",
                {
                    "role": "assistant",
                    "text": result.get("message", ""),
                },
                room=sid,
            )

            await sio.emit(
                "voice_status",
                {
                    "status": "tool_executed",
                    "message": result.get("message", ""),
                },
                room=sid,
            )

        asyncio.create_task(handle_transcription())

    def on_error(message):
        asyncio.create_task(
            sio.emit(
                "voice_error",
                {
                    "message": message,
                },
                room=sid,
            )
        )

    voice_loop = VoiceLoop(
        on_status=on_status,
        on_transcription=on_transcription,
        on_error=on_error,
    )

    voice_task = asyncio.create_task(voice_loop.run())

    def on_voice_task_done(task):
        global voice_loop, voice_task

        try:
            task.result()
        except asyncio.CancelledError:
            print("[VOICE] Voice task done: cancelled")
        except Exception as error:
            print(f"[VOICE] Voice task crashed: {error}")

        voice_loop = None
        voice_task = None

        print("[VOICE] Voice task cleaned up")

        # Do not restart wake here.
        # stop_voice() is responsible for restarting wake.
        # This avoids duplicate wake restarts.

    voice_task.add_done_callback(on_voice_task_done)

    await sio.emit(
        "voice_status",
        {
            "status": "starting",
            "message": "Starting real-time voice session...",
        },
        room=sid,
    )


@sio.event
async def start_voice(sid, data=None):
    print(f"[VOICE] start_voice received from {sid}")
    print(f"[VOICE] data: {data}")

    await start_voice_internal(sid, started_by_wake=False)


@sio.event
async def stop_voice(sid):
    global voice_loop, voice_task

    print(f"[VOICE] stop_voice received from {sid}")

    if voice_loop:
        voice_loop.stop()

    if voice_task and not voice_task.done():
        print("[VOICE] Cancelling voice task...")
        voice_task.cancel()

        try:
            await voice_task
        except asyncio.CancelledError:
            print("[VOICE] Voice task cancelled successfully")
        except Exception as error:
            print(f"[VOICE] Error while cancelling voice task: {error}")

    voice_loop = None
    voice_task = None

    await sio.emit(
        "voice_status",
        {
            "status": "stopped",
            "message": "Voice session stopped. Say 'Hola Anka' to wake me.",
        },
        room=sid,
    )

    await start_wake_listener(sid)


@sio.event
async def pause_voice(sid):
    global voice_loop

    print(f"[VOICE] pause_voice received from {sid}")

    if voice_loop:
        voice_loop.set_paused(True)

    await sio.emit(
        "voice_status",
        {
            "status": "paused",
            "message": "Voice session paused",
        },
        room=sid,
    )


@sio.event
async def resume_voice(sid):
    global voice_loop

    print(f"[VOICE] resume_voice received from {sid}")

    if voice_loop:
        voice_loop.set_paused(False)

    await sio.emit(
        "voice_status",
        {
            "status": "resumed",
            "message": "Voice session resumed",
        },
        room=sid,
    )


@sio.event
async def start_wake(sid):
    print(f"[WAKE] start_wake received from {sid}")
    await start_wake_listener(sid)


@sio.event
async def stop_wake(sid):
    print(f"[WAKE] stop_wake received from {sid}")

    await stop_wake_listener()

    await sio.emit(
        "voice_status",
        {
            "status": "wake_stopped",
            "message": "Wake listener stopped.",
        },
        room=sid,
    )


if __name__ == "__main__":
    print(f"[VOICE] Starting ANKA Voice Backend on port {VOICE_BACKEND_PORT}")

    uvicorn.run(
        socket_app,
        host="0.0.0.0",
        port=VOICE_BACKEND_PORT,
    )