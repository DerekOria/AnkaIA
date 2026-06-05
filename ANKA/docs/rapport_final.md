# Journal de recherche pour le projet ANKA

## 1. Objectif de recherche

L’objectif de ce projet est de concevoir un assistant IA personnel nommé **ANKA**, capable d’interagir avec l’utilisateur de façon vocale, de comprendre des demandes techniques et d’exécuter certaines actions simples sur l’ordinateur. Au départ, l’idée était de créer un assistant local basé sur un modèle comme Llama 3 avec Ollama. Cependant, durant la recherche et le développement, l’architecture a évolué vers une solution hybride : une partie fonctionne localement, comme la détection du mot d’activation, et une autre partie utilise une API externe pour obtenir une conversation vocale plus fluide.

Le but principal est donc de créer un assistant capable de :

- se réveiller avec un mot d’activation vocal ;
- maintenir une conversation vocale naturelle ;
- afficher les échanges dans une interface web ;
- exécuter des commandes simples comme ouvrir Google, ouvrir YouTube ou effectuer une recherche ;
- servir de base à un futur assistant plus avancé pour le support informatique, l’analyse d’erreurs et l’automatisation.

Cette recherche se concentre surtout sur la communication vocale en temps réel, la stabilité de l’architecture et l’intégration d’outils dans l’assistant.

---

## 2. Évolution du projet

Au début du projet, plusieurs pistes avaient été envisagées :

- utiliser **Ollama** pour exécuter un LLM localement ;
- utiliser **Llama 3** comme modèle de langage principal ;
- utiliser **Whisper** pour la transcription vocale ;
- utiliser **YOLOv8** pour la vision par ordinateur ;
- utiliser **PyAutoGUI** pour automatiser des actions sur le système.

Après plusieurs tests, certaines de ces technologies ont été retirées de la version actuelle du projet. L’objectif prioritaire est devenu la création d’un assistant vocal fluide. Pour cette raison, le projet utilise maintenant **Gemini Live API** pour la conversation vocale en temps réel, car cette solution gère directement l’audio, la transcription et la réponse vocale. Pour garder une partie locale, **Vosk** est utilisé pour détecter le mot d’activation hors ligne.

Les technologies comme YOLOv8, PyAutoGUI, l’authentification faciale et le contrôle par gestes ne sont donc pas utilisées dans la version actuelle. Elles restent des pistes possibles pour une version future.

---

## 3. Architecture actuelle du projet

L’architecture actuelle du projet ANKA est composée de trois grandes parties :

1. **Interface utilisateur**
2. **Backend Node/Express**
3. **Backend vocal Python**

L’interface utilisateur est développée avec React. Elle affiche l’état du système, les conversations, les transcriptions vocales et les messages de diagnostic. Elle permet aussi de démarrer ou d’arrêter le mode vocal avec un bouton.

Le backend principal de l’application gère les conversations textuelles et les routes API classiques. Le backend vocal Python est séparé et se concentre sur la voix, le mot d’activation et les commandes vocales.

Le backend vocal utilise FastAPI et Socket.IO pour communiquer en temps réel avec l’interface React. Il contient plusieurs modules importants :

- `voice-server.py` : coordonne les connexions, le wake word, le mode vocal et les événements Socket.IO ;
- `wake_listener.py` : détecte localement le mot d’activation avec Vosk ;
- `voice_loop.py` : gère la conversation vocale avec Gemini Live ;
- `command_router.py` : détecte les commandes vocales et déclenche les outils ;
- `tools/browser_tools.py` : contient les actions comme ouvrir Google, ouvrir YouTube ou faire une recherche.

Cette séparation permet d’éviter de mélanger toute la logique dans un seul fichier et rend le projet plus facile à maintenir.

---

## 4. Module vocal et conversation en temps réel

Le module vocal est l’élément central de la version actuelle d’ANKA. Il permet à l’utilisateur de parler directement à l’assistant et de recevoir une réponse vocale.

Le système fonctionne de la manière suivante :

1. ANKA démarre en mode attente.
2. Le module Vosk écoute localement le microphone.
3. Si l’utilisateur dit « Hola Anka », le wake word est détecté.
4. Le wake listener est arrêté pour libérer le microphone.
5. Gemini Live démarre la conversation vocale.
6. L’utilisateur peut parler normalement sans répéter « Hola Anka ».
7. Quand l’utilisateur arrête le mode vocal, ANKA revient en mode attente.

Cette logique est importante, car deux modules ne peuvent pas utiliser le microphone en même temps de façon stable. Vosk est donc arrêté avant de lancer Gemini Live.

Gemini Live est utilisé pour la conversation vocale, car il permet une interaction plus fluide qu’un pipeline séparé avec transcription, LLM et synthèse vocale. Cela simplifie beaucoup l’architecture, même si cela rend cette partie dépendante d’Internet.

---

## 5. Détection du mot d’activation avec Vosk

Le mot d’activation est géré localement avec Vosk. L’intérêt est que cette partie peut fonctionner sans Internet. Cela permet à ANKA d’être toujours en attente du mot « Hola Anka » sans envoyer l’audio à une API externe.

Cependant, Vosk peut parfois mal transcrire certains mots. Par exemple, il peut comprendre « uno nunca blanca » au lieu de « Hola Anka ». Pour corriger ce problème, la détection du wake word ne repose pas seulement sur une phrase exacte. Le code accepte aussi plusieurs variantes proches, comme :

- hola anka ;
- hola anca ;
- hola blanca ;
- hola banca ;
- uno nunca blanca ;
- nunca blanca.

Cette approche rend la détection plus tolérante aux erreurs de transcription. Elle n’est pas parfaite, mais elle améliore la fiabilité dans un environnement réel.

---

## 6. Gestion des états de l’interface

Une partie importante de la recherche a été la gestion des états de l’interface utilisateur. L’assistant peut être dans plusieurs états :

- connecté au backend vocal ;
- en attente du mot d’activation ;
- en démarrage du mode vocal ;
- en conversation vocale ;
- arrêté ;
- en erreur.

L’interface React doit afficher clairement ces états. Par exemple, quand ANKA attend « Hola Anka », l’interface ne doit pas donner l’impression que la conversation complète est déjà active. Par contre, quand le wake word est détecté et que Gemini Live démarre, l’interface doit passer en mode écoute.

Cette distinction est importante pour rendre l’expérience plus naturelle et éviter la confusion entre le mode veille et le vrai mode conversationnel.

---

## 7. Commandes vocales et outils

Une autre partie du projet consiste à donner à ANKA la capacité d’exécuter des actions simples. Pour cela, un module `CommandRouter` a été ajouté.

Le rôle du `CommandRouter` est d’analyser le texte transcrit par Gemini et de détecter si l’utilisateur demande une action. Par exemple, il peut reconnaître des commandes comme :

- “Open Google”
- “Open YouTube”
- “Search YouTube for JavaScript tutorial”
- “Busca en YouTube música lofi”
- “Cherche sur Google météo Montréal”

Quand une commande est détectée, ANKA utilise un outil Python pour ouvrir le navigateur ou lancer une recherche. Pour l’instant, les outils sont volontairement simples. Ils permettent surtout de valider le concept d’un assistant capable de comprendre une intention et d’agir sur l’ordinateur.

Cette partie ouvre la porte à des fonctionnalités plus avancées, comme ouvrir Visual Studio Code, ouvrir un dossier de projet, analyser des fichiers ou exécuter des commandes contrôlées.

---

## 8. Technologies retenues

### 8.1 Gemini Live API

Gemini Live API est utilisé pour la conversation vocale en temps réel. Il permet à ANKA de recevoir l’audio de l’utilisateur et de répondre vocalement. Cette technologie a été retenue parce qu’elle permet une conversation plus fluide qu’une solution entièrement locale.

Son principal avantage est la fluidité de l’échange vocal. Son principal inconvénient est la dépendance à Internet et à une clé API.

### 8.2 Vosk

Vosk est utilisé pour la reconnaissance vocale locale du mot d’activation. Il permet à ANKA de détecter « Hola Anka » sans connexion Internet. Cette technologie a été choisie parce qu’elle est open-source, utilisable en Python et adaptée à une détection vocale simple.

Son avantage principal est le fonctionnement hors ligne. Sa limite principale est que la transcription peut être imparfaite, surtout avec des mots inhabituels ou des accents.

### 8.3 FastAPI

FastAPI est utilisé pour exposer le backend vocal Python et permettre la communication avec l’interface. Il permet de créer une API légère et structurée.

### 8.4 Socket.IO

Socket.IO est utilisé pour la communication en temps réel entre l’interface React et le backend vocal Python. Cette communication est nécessaire pour envoyer les états du système, les transcriptions, les erreurs et les résultats d’outils.

### 8.5 React

React est utilisé pour construire l’interface utilisateur. Il permet d’afficher les conversations, les messages de diagnostic, l’état du système et l’état vocal de l’assistant.

### 8.6 PyAudio

PyAudio est utilisé dans le backend Python pour accéder au microphone et aux haut-parleurs. Il permet d’envoyer l’audio à Gemini Live et de lire les réponses vocales.

---

## 9. Technologies non retenues dans la version actuelle

### 9.1 Ollama et Llama 3

Ollama et Llama 3 ont été étudiés pour faire fonctionner un modèle local. Cette option est intéressante pour la confidentialité et le fonctionnement hors ligne. Cependant, pour une conversation vocale fluide, cette solution demanderait d’ajouter plusieurs composants séparés : transcription vocale, modèle local et synthèse vocale.

Pour la version actuelle, Gemini Live a été retenu comme moteur principal de conversation vocale. Ollama et Llama 3 restent des pistes possibles pour une version future entièrement locale.

### 9.2 Whisper

Whisper avait été envisagé pour la transcription vocale. Il n’est pas utilisé dans la version actuelle parce que Gemini Live fournit déjà une transcription et une réponse vocale dans le même flux. Vosk est utilisé uniquement pour le wake word local.

### 9.3 YOLOv8

YOLOv8 avait été envisagé pour la vision par ordinateur. Cette fonctionnalité n’est pas utilisée dans la version actuelle. Elle pourrait être utile plus tard pour permettre à ANKA d’analyser visuellement l’environnement, mais ce n’est pas une priorité dans la version actuelle.

### 9.4 PyAutoGUI

PyAutoGUI avait été envisagé pour contrôler la souris et le clavier. Dans la version actuelle, ANKA utilise plutôt des outils contrôlés et limités, comme l’ouverture de Google ou de YouTube. Cette approche est plus sécuritaire, car elle évite de donner un contrôle trop large au système.

### 9.5 Authentification faciale et gestes

L’authentification faciale et le contrôle par gestes ont été étudiés en comparaison avec ADA. Cependant, ils ne sont pas encore intégrés dans ANKA. Ils restent des possibilités futures, mais la priorité actuelle est la stabilisation de la voix, du wake word et des outils.

---

## 10. Limites actuelles

Le projet fonctionne, mais il possède encore plusieurs limites :

- la conversation vocale avec Gemini Live nécessite Internet ;
- le wake word local peut parfois mal comprendre certains mots ;
- les commandes sont encore limitées à quelques actions simples ;
- l’assistant ne peut pas encore analyser automatiquement tous les problèmes de la CLI ;
- les outils système doivent rester contrôlés pour éviter des actions dangereuses ;
- l’interface peut encore être améliorée pour distinguer plus clairement le mode veille et le mode conversation.

Ces limites sont normales pour un prototype. Elles permettent de définir les prochaines étapes du projet.

---

## 11. Pistes d’amélioration

Les prochaines améliorations possibles sont :

1. améliorer le routeur de commandes pour comprendre des phrases plus naturelles ;
2. ajouter des commandes locales comme ouvrir VS Code, ouvrir un dossier ou ouvrir le terminal ;
3. ajouter une mémoire locale pour enregistrer les préférences de l’utilisateur ;
4. ajouter une analyse automatique des erreurs de terminal ;
5. intégrer une base documentaire pour faire du support informatique avec RAG ;
6. ajouter une authentification faciale plus tard ;
7. ajouter un contrôle par gestes plus tard ;
8. prévoir un mode entièrement local avec Ollama, Vosk et un moteur de synthèse vocale local.

---

## 12. Conclusion

La recherche a permis de faire évoluer ANKA d’une idée d’assistant local vers un assistant vocal hybride plus fonctionnel. Le projet actuel combine un wake word local avec Vosk et une conversation vocale fluide avec Gemini Live. Cette architecture permet d’obtenir un bon équilibre entre réactivité, simplicité et capacité de conversation.

ANKA est maintenant capable de se réveiller avec « Hola Anka », de discuter avec l’utilisateur, d’afficher les échanges dans l’interface et d’exécuter certaines commandes vocales. Même si le projet n’est pas encore un assistant complet de support informatique, il possède maintenant une base solide pour évoluer vers un assistant personnel plus avancé.

---

# Bibliographie

[1] Ollama, “Ollama,” Ollama, 2026. [Online]. Available: https://ollama.com. [Accessed: Jun. 5, 2026].

[2] Meta, “Introducing Meta Llama 3: The most capable openly available LLM to date,” Meta AI, Apr. 18, 2024. [Online]. Available: https://ai.meta.com/blog/meta-llama-3/. [Accessed: Jun. 5, 2026].

[3] Google AI for Developers, “Gemini Live API,” Google. [Online]. Available: https://ai.google.dev/gemini-api/docs/live. [Accessed: Jun. 5, 2026].

[4] Vosk, “Vosk Speech Recognition Toolkit,” Vosk. [Online]. Available: https://alphacephei.com/vosk/. [Accessed: Jun. 5, 2026].

[5] FastAPI, “FastAPI documentation,” FastAPI. [Online]. Available: https://fastapi.tiangolo.com/. [Accessed: Jun. 5, 2026].

[6] Socket.IO, “Socket.IO documentation,” Socket.IO. [Online]. Available: https://socket.io/docs/v4/. [Accessed: Jun. 5, 2026].

[7] React, “React documentation,” Meta Open Source. [Online]. Available: https://react.dev/. [Accessed: Jun. 5, 2026].

[8] PyAudio, “PyAudio documentation,” PyAudio. [Online]. Available: https://people.csail.mit.edu/hubert/pyaudio/docs/. [Accessed: Jun. 5, 2026].

[9] A. Sweigart, “Welcome to PyAutoGUI’s documentation,” PyAutoGUI. [Online]. Available: https://pyautogui.readthedocs.io/en/latest/. [Accessed: Jun. 5, 2026].

[10] Ultralytics, “YOLOv8 documentation,” Ultralytics. [Online]. Available: https://docs.ultralytics.com/. [Accessed: Jun. 5, 2026].

[11] OpenAI, “Whisper,” GitHub repository. [Online]. Available: https://github.com/openai/whisper. [Accessed: Jun. 5, 2026].

# Médiagraphie

[12] D. Oria, “AnkaIA,” GitHub repository. [Online]. Available: https://github.com/DerekOria/AnkaIA. [Accessed: Jun. 5, 2026].
