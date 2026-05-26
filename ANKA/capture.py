import pyautogui
import requests
import os
import time
import easyocr

# Inicializamos el lector de OCR (solo una vez)
reader = easyocr.Reader(['fr', 'en']) 

def take_screenshot_and_analyze():
    print("📸 ANKA : Analyse de l'écran en cours...")
    screenshot_path = "temp_screenshot.png"
    pyautogui.screenshot().save(screenshot_path)
    
    # --- Lógica de Detección ---
    # AQUÍ IRÍA YOLO (lo dejamos como paso futuro)
    # Por ahora, usamos OCR como nuestra capa principal de extracción de texto
    print("🔍 Détection via EasyOCR en cours...")
    result_ocr = reader.readtext(screenshot_path, detail=0)
    texto_detectado = " ".join(result_ocr)
    
    print(f"📄 Texte extrait : '{texto_detectado[:50]}...'")
    
    # Enviamos el texto al backend para que Llama 3 lo diagnostique
    payload = {"error_log": texto_detectado}
    
    try:
        response = requests.post("http://localhost:3000/analyze", json=payload)
        # ... (el resto del código de manejo de respuesta sigue igual)
        if response.status_code == 200:
            result = response.json()
            print("\n================ DIAGNOSTIC D'ANKA ================")
            print(f"Type d'erreur : {result['diagnostic']['error_type']}")
            print(f"Cause probable : {result['diagnostic']['cause']}")
            print("Étapes de résolution :")
            for i, step in enumerate(result['diagnostic']['steps'], 1):
                print(f"  {i}. {step}")
            print("=====================================================\n")
    except Exception as e:
        print(f"❌ Erreur : {e}")
    finally:
        if os.path.exists(screenshot_path):
            os.remove(screenshot_path)

if __name__ == "__main__":
    time.sleep(2)
    take_screenshot_and_analyze()