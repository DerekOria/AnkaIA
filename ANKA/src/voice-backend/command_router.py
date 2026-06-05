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
            "ã": "a",
            "é": "e",
            "è": "e",
            "ê": "e",
            "ë": "e",
            "í": "i",
            "ì": "i",
            "î": "i",
            "ï": "i",
            "ó": "o",
            "ò": "o",
            "ô": "o",
            "ö": "o",
            "õ": "o",
            "ú": "u",
            "ù": "u",
            "û": "u",
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
            "\"": "",
            "'": "",
        }

        for old, new in replacements.items():
            normalized = normalized.replace(old, new)

        normalized = normalized.replace("you tube", "youtube")
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

    def contains_any(self, text, words):
        return any(word in text for word in words)

    def clean_query(self, text, words_to_remove):
        query = text

        for word in words_to_remove:
            query = re.sub(rf"\b{re.escape(word)}\b", " ", query)

        query = re.sub(r"\s+", " ", query).strip()
        return query

    def remove_polite_words(self, text):
        polite_words = [
            "please",
            "for me",
            "can you",
            "could you",
            "would you",
            "i want you to",
            "i need you to",
            "por favor",
            "puedes",
            "puede",
            "podrias",
            "quiero que",
            "necesito que",
            "s il te plait",
            "stp",
            "peux tu",
            "peut tu",
            "pour moi",
            "je veux que",
            "j ai besoin que",
        ]

        cleaned = text

        for phrase in polite_words:
            cleaned = cleaned.replace(phrase, " ")

        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned

    def execute_open_google(self):
        return {
            "handled": True,
            "command": "open_google",
            **open_google(),
        }

    def execute_open_youtube(self):
        return {
            "handled": True,
            "command": "open_youtube",
            **open_youtube(),
        }

    def execute_search_google(self, query):
        return {
            "handled": True,
            "command": "search_google",
            **search_google(query),
        }

    def execute_search_youtube(self, query):
        return {
            "handled": True,
            "command": "search_youtube",
            **search_youtube(query),
        }

    def detect_open_command(self, text):
        open_words = [
            "open",
            "ouvre",
            "ouvrir",
            "abre",
            "abrir",
            "lance",
            "launch",
            "start",
            "demarre",
            "demarrer",
        ]

        if self.contains_any(text, open_words):
            if "google" in text:
                return self.execute_open_google()

            if "youtube" in text:
                return self.execute_open_youtube()

        direct_google = [
            "go to google",
            "va sur google",
            "vas sur google",
            "ve a google",
        ]

        if any(phrase in text for phrase in direct_google):
            return self.execute_open_google()

        direct_youtube = [
            "go to youtube",
            "va sur youtube",
            "vas sur youtube",
            "ve a youtube",
        ]

        if any(phrase in text for phrase in direct_youtube):
            return self.execute_open_youtube()

        return None

    def detect_youtube_search(self, text):
        youtube_present = "youtube" in text

        if not youtube_present:
            return None

        search_words = [
            "search",
            "look up",
            "find",
            "cherche",
            "chercher",
            "recherche",
            "rechercher",
            "trouve",
            "trouver",
            "busca",
            "buscar",
            "encuentra",
            "encontrar",
        ]

        play_words = [
            "play",
            "put",
            "show me",
            "mets",
            "met",
            "joue",
            "lance",
            "pon",
            "ponme",
            "reproduce",
            "muestra",
        ]

        if not self.contains_any(text, search_words + play_words):
            return None

        words_to_remove = [
            "search",
            "look",
            "up",
            "find",
            "for",
            "on",
            "in",
            "youtube",
            "cherche",
            "chercher",
            "recherche",
            "rechercher",
            "trouve",
            "trouver",
            "sur",
            "dans",
            "pour",
            "mets",
            "met",
            "joue",
            "lance",
            "une",
            "un",
            "la",
            "le",
            "les",
            "des",
            "video",
            "videos",
            "busca",
            "buscar",
            "encuentra",
            "encontrar",
            "en",
            "de",
            "por",
            "pon",
            "ponme",
            "reproduce",
            "muestra",
            "un",
            "una",
            "el",
            "la",
            "los",
            "las",
            "video",
            "videos",
        ]

        query = self.clean_query(text, words_to_remove)

        if query:
            return self.execute_search_youtube(query)

        return None

    def detect_google_search(self, text):
        google_present = "google" in text

        search_words = [
            "search",
            "look up",
            "find",
            "google",
            "cherche",
            "chercher",
            "recherche",
            "rechercher",
            "trouve",
            "trouver",
            "busca",
            "buscar",
            "encuentra",
            "encontrar",
        ]

        if not self.contains_any(text, search_words):
            return None

        # If user says YouTube, YouTube search has priority elsewhere.
        if "youtube" in text:
            return None

        words_to_remove = [
            "search",
            "look",
            "up",
            "find",
            "for",
            "on",
            "in",
            "google",
            "cherche",
            "chercher",
            "recherche",
            "rechercher",
            "trouve",
            "trouver",
            "sur",
            "dans",
            "pour",
            "busca",
            "buscar",
            "encuentra",
            "encontrar",
            "en",
            "de",
            "por",
        ]

        query = self.clean_query(text, words_to_remove)

        if query:
            return self.execute_search_google(query)

        return None

    def detect_natural_media_command(self, text):
        # Examples:
        # "put lofi music"
        # "mets de la musique lofi"
        # "pon musica lofi"
        # If no platform is specified, use YouTube.
        media_words = [
            "music",
            "song",
            "video",
            "lofi",
            "playlist",
            "musique",
            "chanson",
            "musica",
            "cancion",
        ]

        action_words = [
            "play",
            "put",
            "start",
            "listen",
            "mets",
            "met",
            "joue",
            "lance",
            "ecouter",
            "pon",
            "ponme",
            "reproduce",
        ]

        if not self.contains_any(text, media_words):
            return None

        if not self.contains_any(text, action_words):
            return None

        words_to_remove = [
            "play",
            "put",
            "start",
            "listen",
            "on",
            "in",
            "youtube",
            "music",
            "song",
            "video",
            "playlist",
            "mets",
            "met",
            "joue",
            "lance",
            "ecouter",
            "sur",
            "dans",
            "musique",
            "chanson",
            "video",
            "playlist",
            "pon",
            "ponme",
            "reproduce",
            "en",
            "musica",
            "cancion",
        ]

        query = self.clean_query(text, words_to_remove)

        if not query:
            query = "music"

        return self.execute_search_youtube(query)

    def detect_and_execute(self, text):
        normalized = self.normalize_text(text)
        normalized = self.remove_polite_words(normalized)

        if not normalized:
            return None

        if self.should_ignore_duplicate(normalized):
            return None

        print(f"[COMMAND] Checking: {normalized}")

        # 1. Open commands first
        result = self.detect_open_command(normalized)
        if result:
            print(f"[COMMAND] Executed: {result.get('command')}")
            return result

        # 2. YouTube searches and media commands
        result = self.detect_youtube_search(normalized)
        if result:
            print(f"[COMMAND] Executed: {result.get('command')}")
            return result

        result = self.detect_natural_media_command(normalized)
        if result:
            print(f"[COMMAND] Executed: {result.get('command')}")
            return result

        # 3. Google search
        result = self.detect_google_search(normalized)
        if result:
            print(f"[COMMAND] Executed: {result.get('command')}")
            return result

        return None