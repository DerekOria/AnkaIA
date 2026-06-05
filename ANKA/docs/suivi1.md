# Journal de recherche pour mon projet ANKA

## Objectif de recherche

L'objectif est d'implémenter un assistant capable de détecter des erreurs/anomalies via la ligne des commandes(cli) par ordinateur et de fournir un support contextuel via un LLM(Llama3) local. La recherche se concentre sur l'optimisation de l'inférence pour une exécution sur hardware local (limitations de ressources) tout en maintenant une précision de détection élevée. Aussi, j'ai l'intêret de personnaliser plus cet assistant IA avec une fonctionalité de voix et écoute, capable de repondre à des questions et comprendre tout type de contexte.

## Fonctionnalités et tâches attendues

Le développement du projet ANKA suit un pipeline séquentiel, allant de la perception de l'environnement à l'exécution d'actions correctives.


### 1. Module de Raisonnement et Support (LLM & Logic)
*   **Intégration de Llama 3 :** Déploiement du modèle dans l'environnement local.
*   **Configuration du *System Prompt* :** Définition de l'identité, des limites et des règles de réponse de l'IA.
*   **Diagnostic automatisé :** Développement de la logique d'analyse des erreurs transmises via la CLI.
*   **Objectif :** Transformer les données brutes (visuelles et vocales) en conseils techniques pertinents et en solutions d'erreurs.

### 2. Module d'Interaction Système (Automation)
*   **Utilisation de PyAutoGUI :** Automatisation des tâches de navigation et des actions correctives au sein de l'environnement de bureau.
*   **Objectif :** Clôturer la boucle de support en permettant à ANKA non seulement de diagnostiquer, mais d'intervenir directement sur le système pour résoudre les erreurs.


### 3. Module de Perception Visuelle (Computer Vision)
*   **Implémentation de YOLOv8 :** Configuration du modèle pour la détection d'objets et la reconnaissance visuelle de l'utilisateur.
*   **Objectif :** Établir la capacité de l'IA à "voir" et comprendre son environnement immédiat pour créer un contexte de travail partagé.

### 4. Module d'Interface Vocale et Écoute (Audio Processing)
*   **Intégration de Whisper :** Mise en place du moteur de reconnaissance vocale pour la transcription en temps réel.
*   **Objectif :** Permettre une communication fluide et naturelle entre l'utilisateur et l'assistant, facilitant la transmission des problématiques.

## Bibliographie

### Ollama
- Outil open-source gratuit qui permet de télécharger et d'exécuter des modèles d'intelligence artificielle  

[1]“Ollama,” ollama.com. https://ollama.com
‌


### Llama3
- "Large Language Model Meta AI" est un modèle de langage d'intelligence artificielle développé par Meta.  

[1]Getguru.com, 2026. https://www.getguru.com/fr/reference/what-is-llama-3#quels-sont-les-principaux-cas-dutilisation-de-llama-3 (accessed May 28, 2026).  
‌  
[2]Meta, “Introducing Meta Llama 3: The most capable openly available LLM to date,” ai.meta.com, Apr. 18, 2024. https://ai.meta.com/blog/meta-llama-3/
‌


### PyAutoGui
- Bibliothèque Python qui permet d'automatiser le contrôle de la souris et du clavier sur Windows, macOS et Linux

[1]A. Sweigart, “Welcome to PyAutoGUI’s documentation! — PyAutoGUI 1.0.0 documentation,” Readthedocs.io, 2014. https://pyautogui.readthedocs.io/en/latest/
‌

### YOLOv8
- 

### Whisper(OPENAI)
-

## Médiagraphie







