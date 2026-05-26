# Proposition formelle de projet – Veille technologique (420-1SX)

**Nom :** Derek Aldair Lopez Oria  
**Session :** Hiver 2026  
**Enseignant :** Nicolas Bourre  
**Date de remise :** 19 avril 2026  

---

## 1. Exploration des idées

| Idée | Description | Faisabilité (7 jours) | Intérêt personnel |
| :--- | :--- | :--- | :--- |
| **1. Architecture de données (OpenSpec)** | Utilisation d'OpenSpec pour générer un schéma de DB et une API à partir de langage naturel. | Élevée (12h de specs, 16h validation). | Explorer le "vibe coding" et la productivité sans écrire de code source. |
| **2. Assistant Support IA (ANKA)** | Assistant vocal local qui capture l'écran automatiquement à la demande, identifie les erreurs via un modèle de vision fine-tuné (YOLOv8), et explique vocalement la solution — sans internet. | **Élevée** avec GPU NVIDIA. Le MVP est modulaire : chaque composante est livrable indépendamment. | **Sujet retenu** : Combine fine-tuning réel, NLP, audio et interface HUD dans un pipeline complet et démonstratif. |
| **3. Traducteur de Logique (GSD)** | Conversion de pseudocode en code Rust/Go via la méthodologie GSD. | Moyenne (Complexité de la syntaxe Rust pour un projet rapide). | Tester si la logique pure peut surpasser la barrière de la syntaxe. |

---

## 2. Choix du projet

**Projet sélectionné :** Idée 2 - Mise en place d'un assistant de diagnostic technique auto-hébergé avec Node.js et Ollama.

* **Pourquoi ce choix :** Ce projet me permet d'approfondir mes compétences en Node.js tout en explorant le domaine de l'IA locale. Il répond à un enjeu crucial en entreprise : l'analyse de données sensibles (logs) sans fuite vers des services tiers.
* **Les défis anticipés :** Optimisation de l'accélération GPU (CUDA) sur Windows, gestion de la latence des modèles avec 16 GB de RAM, et précision du "prompt engineering" pour le diagnostic technique.
* **Les ressources nécessaires :** PC avec GPU NVIDIA, environnement Node.js, framework Express, Ollama et drivers CUDA.

---

## 3. Proposition formelle

### Titre du projet
**Anka : Assistant IA local de support technique.**

### Introduction
Ce projet s’inscrit dans le thème « L’IA au service du développeur ». L'objectif est de démontrer comment automatiser le diagnostic technique de manière privée et performante. Anka combine la vision par ordinateur (YOLOv8) pour identifier l'erreur visuelle et un LLM local (Ollama) pour générer la solution, le tout orchestré par Node.js.

### Prérecherche
Parmi les options explorées, l'assistant local Node.js est le plus pertinent. Contrairement au volet de développement pur, celui-ci me force à comprendre l'infrastructure de l'IA (modèles Llama 3 vs Mistral) et son intégration via des outils modernes de backend JavaScript.

### Objectifs du projet
* **Objectif 1 :** Déployer une instance fonctionnelle d'Ollama avec accélération GPU.
* **Objectif 2 :** Concevoir une API Express (`POST /analyze`) pour traiter les fichiers de logs.
* **Objectif 3 :** Utiliser la méthodologie **GSD (Get-Shit-Done)** pour structurer les spécifications du système (SDD). Dans ce projet, GSD se traduit concrètement par la rédaction d'un document de spécifications contenant les *system prompts*, les règles de parsing des logs et les critères d'acceptation, avant toute écriture de code.
* **Objectif 4 :** Comparer les performances (latence, pertinence et consommation RAM) de deux modèles LLM locaux : Llama 3 (8B) et Mistral (7B).

### MVP (Minimum Viable Product)
Le projet sera considéré comme **terminé** si :
1. L'application Node.js capture l'écran et identifie une erreur via YOLOv8.
2. Une route Express transmet l'erreur identifiée à Ollama.
3. Ollama retourne une solution structurée (Cause, Solution) en moins de 10 secondes.
4. Une étude comparative compare la précision de Llama 3 et Mistral pour ce diagnostic.

### Méthodologie (Approche SDD avec GSD)
Le projet suit une approche rigoureuse de développement piloté par les spécifications. La méthodologie GSD est appliquée comme suit : avant chaque phase, un document de specs est rédigé. Le code n'est écrit qu'une fois ces specs validées.

* **Phase 1 - Infrastructure (Jours 1-2) :** Setup des drivers CUDA, installation d'Ollama et tests initiaux.
* **Phase 2 - Spécifications GSD (Jour 3) :** Rédaction formelle du document de specs : *system prompts*, règles de parsing et critères d'acceptation de l'API.
* **Phase 3 - Développement Backend (Jours 4-6) :** Création du serveur Express et intégration d' `ollama-js`, en suivant strictement les specs de la Phase 2.
* **Phase 4 - Tests, Benchmark et Validation (Jour 7) :** Analyse de logs réels, mesure comparative (Llama 3 vs Mistral) et rédaction du rapport final.

### Outils et technologies
* **Inférence :** Ollama
* **Modèles :** Llama 3 (8B) et Mistral (7B)
* **Backend :** Node.js, framework Express
* **Librairie d'intégration :** `ollama-js`
* **Méthodologie :** GSD (Get-Shit-Done) pour le volet SDD
* **Hardware :** GPU NVIDIA, 16 GB RAM, Windows

### Résultats attendus
Je prévois de démontrer qu'un serveur IA local peut rivaliser avec des outils cloud pour des tâches de support. Les résultats incluront :
1. Une démonstration vidéo du script analysant un crash serveur en temps réel, sans internet.
2. Un tableau comparatif des performances (latence, pertinence, RAM) permettant de conclure quel modèle est le plus adapté au contexte PME.

