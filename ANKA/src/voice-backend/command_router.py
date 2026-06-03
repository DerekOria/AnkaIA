import time
import re

from tools.browser_tools import (
    open_google,
    open_youtube,
    search_google,
    search_youtube,
)


class CommandRouter:
    def __init__(self):
        self.last_command_text = ""
        self.last_command_time = 0
        self.cooldown_seconds = 4

    def normalize_text(self, text):
        if not text:
            return ""

        normalized = text.lower()

        replacements = {
            "á": "a",
            "à": "a",
            "â": "a",
            "ä": "a",
            "é": "e",
            "è": "e",
            "ê": "e",
            "ë": "e",
            "í": "i",
            "ï": "i",
            "ó": "o",
            "ô": "o",
            "ö": "o",
            "ú": "u",
            "ù": "u",
            "ü": "u",
            "ñ": "n",
            "ç": "c",
            "¿": "",
            "?": "",
            "¡": "",
            "!": "",
            ".": "",
            ",": "",
            ";": "",
            ":": "",
        }

        for old, new in replacements.items():
            normalized = normalized.replace(old, new)

        normalized = re.sub(r"\s+", " ", normalized).strip()

        return normalized

    def should_ignore_duplicate(self, normalized_text):
        now = time.time()

        if (
            normalized_text == self.last_command_text
            and now - self.last_command_time < self.cooldown_seconds
        ):
            return True

        self.last_command_text = normalized_text
        self.last_command_time = now

        return False

    def remove_prefix(self, text, prefixes):
        for prefix in prefixes:
            if text.startswith(prefix):
                return text[len(prefix):].strip()

        return ""

    def detect_and_execute(self, text):
        normalized = self.normalize_text(text)

        if not normalized:
            return None

        # Prevent the same command from running many times because
        # Gemini/Vosk can repeat transcriptions.
        if self.should_ignore_duplicate(normalized):
            return None

        # ------------------------------------------------------------
        # OPEN GOOGLE
        # ------------------------------------------------------------
        open_google_phrases = [
            "open google",
            "ouvre google",
            "ouvrir google",
            "abre google",
            "abrir google",
        ]

        if any(phrase in normalized for phrase in open_google_phrases):
            return {
                "handled": True,
                "command": "open_google",
                **open_google(),
            }

        # ------------------------------------------------------------
        # OPEN YOUTUBE
        # ------------------------------------------------------------
        open_youtube_phrases = [
            "open youtube",
            "open you tube",
            "ouvre youtube",
            "ouvre you tube",
            "ouvrir youtube",
            "abre youtube",
            "abre you tube",
            "abrir youtube",
        ]

        if any(phrase in normalized for phrase in open_youtube_phrases):
            return {
                "handled": True,
                "command": "open_youtube",
                **open_youtube(),
            }

        # ------------------------------------------------------------
        # SEARCH YOUTUBE
        # ------------------------------------------------------------
        youtube_prefixes = [
            "search youtube for",
            "search you tube for",
            "search on youtube",
            "search on you tube",
            "look up on youtube",
            "look up on you tube",
            "cherche sur youtube",
            "cherche sur you tube",
            "recherche sur youtube",
            "recherche sur you tube",
            "busca en youtube",
            "busca en you tube",
            "buscar en youtube",
            "buscar en you tube",
        ]

        for prefix in youtube_prefixes:
            if normalized.startswith(prefix):
                query = self.remove_prefix(normalized, [prefix])

                if query:
                    return {
                        "handled": True,
                        "command": "search_youtube",
                        **search_youtube(query),
                    }

        # More flexible YouTube detection
        if "youtube" in normalized or "you tube" in normalized:
            flexible_patterns = [
                "search",
                "cherche",
                "recherche",
                "busca",
                "buscar",
            ]

            if any(word in normalized for word in flexible_patterns):
                query = normalized

                words_to_remove = [
                    "search",
                    "cherche",
                    "recherche",
                    "busca",
                    "buscar",
                    "on",
                    "sur",
                    "en",
                    "youtube",
                    "you tube",
                    "for",
                    "pour",
                    "de",
                ]

                for word in words_to_remove:
                    query = query.replace(word, " ")

                query = re.sub(r"\s+", " ", query).strip()

                if query:
                    return {
                        "handled": True,
                        "command": "search_youtube",
                        **search_youtube(query),
                    }

        # ------------------------------------------------------------
        # SEARCH GOOGLE
        # ------------------------------------------------------------
        google_prefixes = [
            "search google for",
            "search on google",
            "google search",
            "look up on google",
            "cherche sur google",
            "recherche sur google",
            "busca en google",
            "buscar en google",
        ]

        for prefix in google_prefixes:
            if normalized.startswith(prefix):
                query = self.remove_prefix(normalized, [prefix])

                if query:
                    return {
                        "handled": True,
                        "command": "search_google",
                        **search_google(query),
                    }

        # More flexible Google detection
        if "google" in normalized:
            flexible_patterns = [
                "search",
                "cherche",
                "recherche",
                "busca",
                "buscar",
            ]

            if any(word in normalized for word in flexible_patterns):
                query = normalized

                words_to_remove = [
                    "search",
                    "cherche",
                    "recherche",
                    "busca",
                    "buscar",
                    "on",
                    "sur",
                    "en",
                    "google",
                    "for",
                    "pour",
                    "de",
                ]

                for word in words_to_remove:
                    query = query.replace(word, " ")

                query = re.sub(r"\s+", " ", query).strip()

                if query:
                    return {
                        "handled": True,
                        "command": "search_google",
                        **search_google(query),
                    }

        return None