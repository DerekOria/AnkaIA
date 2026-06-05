import os
import socket


def can_reach_host(host, port=443, timeout=2.0):
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def can_use_gemini():
    """
    Returns True only if:
    - local mode is not forced
    - GEMINI_API_KEY exists
    - internet/Gemini endpoint is reachable
    """

    force_local = os.getenv("FORCE_LOCAL_VOICE", "0").strip() == "1"

    if force_local:
        print("[CONNECTIVITY] FORCE_LOCAL_VOICE=1, using local offline voice")
        return False

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        print("[CONNECTIVITY] No GEMINI_API_KEY, using local offline voice")
        return False

    is_online = can_reach_host("generativelanguage.googleapis.com", 443)

    if not is_online:
        print("[CONNECTIVITY] Gemini endpoint unreachable, using local offline voice")
        return False

    print("[CONNECTIVITY] Gemini endpoint reachable, using Gemini Live")
    return True