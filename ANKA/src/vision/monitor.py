import time
import requests
import os

# Ruta al archivo que el servidor escribirá
LOG_FILE = "error.log"

def monitor_logs():
    print("👀 ANKA : Surveillance du fichier error.log activée...")
    
    # Abrimos el archivo y nos situamos al final para esperar nuevas entradas
    if not os.path.exists(LOG_FILE):
        open(LOG_FILE, 'w').close() # Crea el archivo si no existe
        
    with open(LOG_FILE, "r") as f:
        # Movemos el puntero al final del archivo
        f.seek(0, 2) 
        
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.5) # Espera medio segundo si no hay nada nuevo
                continue
            
            print(f"🚨 Nouvelle erreur détectée : {line.strip()}")
            enviar_al_backend(line.strip())

def enviar_al_backend(error_text):
    payload = {"error_log": error_text}
    try:
        response = requests.post("http://localhost:3000/analyze", json=payload)
        if response.status_code == 200:
            result = response.json()
            diag = result.get('diagnostic', {})
            
            print("\n================ DIAGNOSTIC D'ANKA ================")
            print(f"Type : {diag.get('error_type')}")
            print(f"Cause : {diag.get('cause')}")
            print("Étapes :")
            for i, step in enumerate(diag.get('steps', []), 1):
                print(f"  {i}. {step}")
            print("=====================================================\n")
    except Exception as e:
        print(f"❌ Erreur de connexion au backend : {e}")

if __name__ == "__main__":
    monitor_logs()