import os
import asyncio
import socketio
import uvicorn
from fastapi import FastAPI
from dotenv import load_dotenv

from wake_listener import WakeListener
from voice_loop import VoiceLoop

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


@app.get("/status")
async def status():
    return {
        "success": True,
        "service": "ANKA Voice Backend",
        "status": "running",
        "voice_running": voice_task is not None and not voice_task.done(),
        "wake_running": wake_task is not None and not wake_task.done(),
    }


async def emit_to_client(event_name, payload, sid=None):
    target_sid = sid or connected_sid

    if not target_sid:
        print(f"[SOCKET] No connected client for event: {event_name}")
        return

    await sio.emit(event_name, payload, room=target_sid)


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


async def start_voice_internal(sid):
    global voice_loop, voice_task, wake_listener

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

    if wake_listener:
        wake_listener.pause()

    def on_status(payload):
        asyncio.create_task(sio.emit("voice_status", payload, room=sid))

    def on_transcription(payload):
        asyncio.create_task(sio.emit("voice_transcription", payload, room=sid))

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
        global voice_loop, voice_task, wake_listener

        try:
            task.result()
        except asyncio.CancelledError:
            print("[VOICE] Voice task done: cancelled")
        except Exception as error:
            print(f"[VOICE] Voice task crashed: {error}")

        voice_loop = None
        voice_task = None

        if wake_listener:
            wake_listener.resume()

        print("[VOICE] Voice task cleaned up")

    voice_task.add_done_callback(on_voice_task_done)

    await sio.emit(
        "voice_status",
        {
            "status": "starting",
            "message": "Starting real-time voice session...",
        },
        room=sid,
    )


async def start_wake_listener(sid):
    global wake_listener, wake_task

    if wake_task and not wake_task.done():
        print("[WAKE] Wake listener already running")
        return

    async def on_wake():
        print("[WAKE] on_wake triggered")

        await sio.emit(
            "wake_detected",
            {
                "message": "Hola Anka detected",
            },
            room=sid,
        )

        await start_voice_internal(sid)

    def on_wake_status(payload):
        asyncio.create_task(sio.emit("voice_status", payload, room=sid))

    wake_listener = WakeListener(
        on_wake=on_wake,
        on_status=on_wake_status,
    )

    wake_task = asyncio.create_task(wake_listener.run())

    print("[WAKE] Wake listener started")


@sio.event
async def start_voice(sid, data=None):
    print(f"[VOICE] start_voice received from {sid}")
    print(f"[VOICE] data: {data}")

    await start_voice_internal(sid)


@sio.event
async def stop_voice(sid):
    global voice_loop, voice_task, wake_listener

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

    if wake_listener:
        wake_listener.resume()

    await sio.emit(
        "voice_status",
        {
            "status": "stopped",
            "message": "Voice session stopped. Say 'Hola Anka' to activate again.",
        },
        room=sid,
    )


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
    global wake_listener, wake_task

    print(f"[WAKE] stop_wake received from {sid}")

    if wake_listener:
        wake_listener.stop()

    if wake_task and not wake_task.done():
        wake_task.cancel()

        try:
            await wake_task
        except asyncio.CancelledError:
            print("[WAKE] Wake task cancelled successfully")
        except Exception as error:
            print(f"[WAKE] Error while cancelling wake task: {error}")

    wake_listener = None
    wake_task = None

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