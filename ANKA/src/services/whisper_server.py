#!/usr/bin/env python
import sys
import os
import subprocess
import tempfile
import shutil

AUDIO_EXTENSIONS = ('.wav', '.mp3', '.m4a', '.flac', '.ogg', '.webm')

def convert_to_wav(source_path):
    if shutil.which('ffmpeg') is None:
        return None

    tmp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    tmp_path = tmp_file.name
    tmp_file.close()
    try:
        subprocess.run(
            ['ffmpeg', '-y', '-i', source_path, tmp_path],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return tmp_path
    except Exception:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        return None


def transcribe_with_faster_whisper(path):
    try:
        from faster_whisper import WhisperModel
        model = WhisperModel('small', device='cpu', compute_type='int8_float32')
        segments, _ = model.transcribe(path)
        return '\n'.join([s.text for s in segments]).strip()
    except Exception:
        return None


def transcribe_with_openai_whisper(path):
    try:
        import whisper
        model = whisper.load_model('small')
        result = model.transcribe(path)
        return result.get('text', '').strip()
    except Exception:
        return None


def transcribe(path):
    text = transcribe_with_faster_whisper(path)
    if text:
        return text

    text = transcribe_with_openai_whisper(path)
    if text:
        return text

    # If the source file is not a supported audio container, try converting with ffmpeg
    if not path.lower().endswith(AUDIO_EXTENSIONS):
        converted = convert_to_wav(path)
        if converted:
            try:
                text = transcribe_with_faster_whisper(converted) or transcribe_with_openai_whisper(converted)
                return text
            finally:
                if os.path.exists(converted):
                    os.remove(converted)
    return None


def main():
    if len(sys.argv) < 2:
        print('', end='')
        return

    audio_path = sys.argv[1]
    transcript = transcribe(audio_path)
    if transcript:
        print(transcript)
    else:
        print('', end='')


if __name__ == '__main__':
    main()
