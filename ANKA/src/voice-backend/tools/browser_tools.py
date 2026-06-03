import webbrowser
from urllib.parse import quote_plus


def open_google():
    webbrowser.open("https://www.google.com")
    return {
        "success": True,
        "message": "Opening Google.",
    }


def open_youtube():
    webbrowser.open("https://www.youtube.com")
    return {
        "success": True,
        "message": "Opening YouTube.",
    }


def search_google(query):
    clean_query = query.strip()

    if not clean_query:
        return {
            "success": False,
            "message": "I need something to search on Google.",
        }

    url = f"https://www.google.com/search?q={quote_plus(clean_query)}"
    webbrowser.open(url)

    return {
        "success": True,
        "message": f"Searching Google for: {clean_query}",
    }


def search_youtube(query):
    clean_query = query.strip()

    if not clean_query:
        return {
            "success": False,
            "message": "I need something to search on YouTube.",
        }

    url = f"https://www.youtube.com/results?search_query={quote_plus(clean_query)}"
    webbrowser.open(url)

    return {
        "success": True,
        "message": f"Searching YouTube for: {clean_query}",
    }