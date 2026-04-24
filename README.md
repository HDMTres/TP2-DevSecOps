# DevSecOps — TP2 : Rapport (format Q/R)

Ce document est rédigé comme un rendu élève, avec les questions du TP puis mes réponses.

> Choix de plateforme pour ce TP : **GitHub Actions uniquement**.

## Étape 1 — Structure du pipeline CI/CD (Architecture YAML)

### Exercice 1.1 — Comprendre les concepts de base

### 1) Quelle est la différence entre un job et un step dans GitHub Actions ? Entre un stage et un job dans GitLab CI ?

**Réponse (élève)**

- **GitHub Actions**
  - Un **job** est un bloc de travail complet exécuté sur un runner.
  - Un **step** est une action ou commande à l’intérieur d’un job.
  - Donc : un job contient plusieurs steps.

- **GitLab CI**
  - Un **stage** est une grande phase du pipeline (ex: test, security, deploy).
  - Un **job** est une tâche concrète placée dans un stage.
  - Donc : un stage regroupe un ou plusieurs jobs.

---

### 2) Qu’est-ce qu’un runner GitHub Actions ? Quel runner utiliserez-vous (hosted vs self-hosted) ?

**Réponse (élève)**

Un **runner** GitHub Actions est la machine qui exécute les jobs du workflow.

Pour ce TP, j’utilise un **runner hosted** (`ubuntu-latest`) car :
- c’est plus rapide à démarrer,
- il n’y a pas d’infrastructure à maintenir,
- il convient bien à un TP CI/CD standard.

Le **self-hosted** est utile si on veut un environnement interne spécifique (réseau privé, outils spéciaux, conformité).

---

### 3) Comment définit-on les dépendances entre jobs dans GitHub Actions (mot-clé à chercher dans la doc) ?

**Réponse (élève)**

Le mot-clé est **`needs`**.

Exemple :
- `dependency-scan` peut dépendre de `secrets-scan` avec `needs: [secrets-scan]`.
- Cela permet d’ordonner les gates et de faire du **fail fast**.

---

### 4) Quelle est l’équivalente GitLab CI du mot-clé "needs" de GitHub Actions ?

**Réponse (élève)**

L’équivalent direct dans GitLab CI est aussi **`needs`**.

- `stages` donne l’ordre global,
- `needs` permet des dépendances plus fines entre jobs (et peut accélérer le pipeline en évitant d’attendre toute la fin d’un stage).

---

## Mini conclusion (élève)

Sur cette étape, j’ai compris la structure logique d’un pipeline DevSecOps :
- découper en jobs/gates,
- ordonner avec `needs`,
- exécuter sur des runners adaptés,
- viser le **fail fast** pour bloquer au plus tôt en cas de problème sécurité.

---

## Exercice 1.2 — Créer le squelette du pipeline

### Option A — GitHub Actions (PLACEHOLDER complétés)

**Réponse (élève)**

J’ai choisi :
- `push.branches`: `main`, `develop`, `feature/**`, `test/**`
- `pull_request.branches`: `main`, `develop`
- `schedule.cron`: `0 2 * * *` (scan quotidien à 02:00 UTC)
- `runs-on`: `ubuntu-latest`
- checkout: `actions/checkout@v4`
- `fetch-depth: 0` (indispensable pour l’historique Git complet, surtout pour les scans de secrets)
- dépendances:
  - `dependency-scan` attend `secrets-scan`
  - `sast` attend `secrets-scan`
  - `container-scan` attend `sast` et `dependency-scan`

Implémentation dans [devsecops.yml](.github/workflows/devsecops.yml).

### Option B — GitLab CI (réponse théorique pour le rapport)

**Réponse (élève)**

Si je devais compléter l’option GitLab CI dans le rapport, je mettrais :
1. `secrets`
2. `sca`
3. `sast`
4. `container`
5. `summary`

Et pour les variables :
- `SECURE_LOG_LEVEL: info`
- `DS_EXCLUDED_PATHS: .git,node_modules,dist,build,target,coverage`

⚠️ Remarque : dans **le projet**, je n’implémente que GitHub Actions.
---

## Étape 2 — Security Gate 1 : Secrets Scanning avec Gitleaks

### Exercice 2.1 — Configurer Gitleaks dans GitHub Actions

**Réponse (élève) — PLACEHOLDER complétés**

J'ai implémenté le job `secrets-scan` avec les valeurs suivantes :

- **`fetch-depth: 0`**  
  → Indispensable car Gitleaks analyse **tout l'historique Git**, pas seulement le dernier commit. Si on mettait `fetch-depth: 1`, les secrets dans les anciens commits ne seraient pas détectés.

- **`config-path: .gitleaks.toml`**  
  → Chemin vers le fichier de configuration Gitleaks du TP1 (à la racine du projet).

- **`if: always()`**  
  → Le rapport doit être uploadé **même si le job échoue** (quand un secret est détecté). Sinon on perd le rapport détaillé.

- **`path: gitleaks-report.json`**  
  → Nom par défaut du rapport généré par `gitleaks-action@v2`.

- **`retention-days: 30`**  
  → Conservation du rapport pendant 30 jours (suffisant pour analyse).

**Comportement attendu :**
- Si Gitleaks détecte un secret → exit code non-nul → job échoue → pipeline bloqué ✅
- Le rapport JSON est uploadé dans les artefacts GitHub pour analyse.

Implémentation : [devsecops.yml](.github/workflows/devsecops.yml#L16-L32)

### Exercice 2.2 — Variante GitLab CI (réponse théorique)

**Réponse (élève)**

Si j'implémentais Gitleaks en GitLab CI, je compléterais les PLACEHOLDER ainsi :

- **`GIT_DEPTH: 0`**  
  → Équivalent de `fetch-depth: 0`, pour récupérer tout l'historique Git.

- **`--source=.`**  
  → Scanner le répertoire courant (racine du projet).

- **`--config=.gitleaks.toml`**  
  → Chemin vers la config Gitleaks.

- **`--report-format=json`**  
  → Format du rapport (json ou sarif selon besoin).

- **`--report-path=gitleaks-report.json`**  
  → Nom du fichier rapport à générer.

- **`when: always`**  
  → Uploader l'artefact même si le job échoue.

- **`paths: - gitleaks-report.json`**  
  → Fichier à sauvegarder en artefact.

- **`expire_in: 30 days`**  
  → Durée de rétention.

⚠️ Dans mon projet, je n'implémente que GitHub Actions.

---

### Exercice 2.3 — Test du Security Gate

**Test effectué (élève)**

J'ai créé la branche test/secret-gate et ajouté un fichier test-secret.txt avec un faux secret AWS.
Le push a été bloqué par GitHub Push Protection (détection côté serveur avant même que le code arrive dans le pipeline).

**Question 7 : Quel est le message d'erreur exact affiché dans les logs quand un secret est détecté ?**

Message GitHub Push Protection :
"Push cannot contain secrets - Amazon AWS Access Key ID (commit: 48e979..., path: test-secret.txt:1) - Amazon AWS Secret Access Key (commit: 48e979..., path: test-secret.txt:2)"

Le secret a été détecté AVANT même d'arriver dans le pipeline CI/CD (protection côté serveur GitHub).

**Question 8 : Combien de secondes dure ce job ?**

Le job Gitleaks dure environ 5-6 secondes (scan très rapide, d'où son placement en premier gate - fail fast).

**Question 9 : Que se passe-t-il pour les jobs dépendants quand Gitleaks échoue ?**

Quand le secret est détecté (ou bloqué par GitHub Push Protection), les jobs dépendants (dependency-scan, sast, container-scan, security-summary) sont automatiquement skipped/cancelled car ils ont needs: [secrets-scan].
C'est le principe fail-fast : on économise du temps de CI en bloquant immédiatement.

---
