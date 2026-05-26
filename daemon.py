import keyboard
import subprocess

def trigger_anka():
    print("⚡ ANKA active par clavier...")
    subprocess.run(["python", "capture.py"])

keyboard.add_hotkey('ctrl+alt+a', trigger_anka)

print("✅ ANKA en espera. Presiona Ctrl+Alt+A para analizar la pantalla.")
keyboard.wait() 