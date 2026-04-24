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

## Étape 3 — Security Gate 2 : SCA avec OWASP Dependency-Check

### Exercice 3.1 — Configurer OWASP Dep-Check avec cache NVD

**Réponse (élève) — PLACEHOLDER complétés**

- **`path:` (cache)**  
  → `~/.m2/repository/org/owasp/dependency-check-data/` (répertoire où Dep-Check stocke la base NVD)

- **`key:` (cache)**  
  → `${{ runner.os }}-dep-check-${{ hashFiles('**/package-lock.json', '**/package.json') }}` (clé basée sur l'OS et le hash des fichiers de dépendances)

- **`restore-keys:`**  
  → `${{ runner.os }}-dep-check-` (restaure le cache même si le hash a changé)

- **`project:`**  
  → `TP2-DevSecOps` (nom du projet)

- **`path:` (scan)**  
  → `.` (scanner tout le projet)

- **`format:`**  
  → `HTML,JSON,SARIF` (plusieurs formats pour analyse et upload GitHub Security)

- **`out:`**  
  → `reports` (répertoire de sortie des rapports)

- **`--failOnCVSS`**  
  → `7` (échec si CVE avec CVSS ≥ 7.0 = HIGH ou CRITICAL)

- **`if:` (upload SARIF)**  
  → `always()` (upload même si le job échoue)

- **`sarif_file:`**  
  → `reports/dependency-check-report.sarif`

**Comportement attendu :**
- Premier run : télécharge la base NVD (~10-15 min)
- Runs suivants avec cache : ~2-3 min
- Si CVE CVSS ≥ 7 détectée → job échoue → pipeline bloqué

Implémentation : [devsecops.yml](.github/workflows/devsecops.yml#L34-L66)

### Exercice 3.2 — Variante GitLab CI (réponse théorique)

**Réponse (élève)**

Si j'implémentais OWASP Dependency-Check en GitLab CI :

- **`cache.paths:`**  
  → `/root/.m2/repository/org/owasp/dependency-check-data/`

- **`--scan`**  
  → `.` (répertoire à scanner)

- **`--format`**  
  → `JSON,HTML` (formats de rapport)

- **`--out`**  
  → `reports` (répertoire de sortie)

- **`--failOnCVSS`**  
  → `7` (seuil de blocage)

- **`artifacts.paths:`**  
  → `reports/*`

- **`reports.dependency_scanning:`**  
  → `reports/dependency-check-report.json`

⚠️ Dans mon projet, je n'implémente que GitHub Actions.

---

### Exercice 3.3 — Analyser les résultats

**Question 12 : Combien de temps dure le job sans cache ? Avec cache ?**

RÉPONSE :
Sans cache (premier run) : 40 secondes environ
Avec cache : Le projet est minimal (package.json sans dépendances lourdes), donc le gain de cache n'est pas significatif ici. Sur un vrai projet, le premier run prendrait 10-15 min (téléchargement base NVD) et les suivants ~2-3 min avec cache.

**Question 13 : Combien de CVE CRITICAL/HIGH ont été détectées ? Retrouvez-vous les mêmes résultats qu'en TP1 ?**

RÉPONSE :
Le projet de test est minimal (package.json vide), donc aucune CVE détectée.
Dans un vrai projet avec dépendances (comme TP1), OWASP Dependency-Check détecterait les mêmes CVE que le scan manuel.

**Question 14 : Comment le rapport apparaît-il dans l'onglet "Security" de GitHub ?**

RÉPONSE :
Le rapport SARIF apparaît dans l'onglet Security > Code scanning.
On y voit :
- L'outil : dependency-check (version 12.2.1)
- Le statut du dernier scan
- Les configurations actives
- Un lien vers le workflow run

**Question 15 : Si le pipeline échoue à cause d'une CVE, comment configurer une exception temporaire sans supprimer le contrôle ?**

RÉPONSE :
OWASP Dependency-Check supporte un fichier `suppression.xml` qui permet d'ignorer temporairement une CVE spécifique avec justification.
On utilise le paramètre `--suppression suppression.xml` et on crée un fichier XML contenant les CVE à ignorer avec leur justification et date d'expiration.

---

## Étape 4 — Security Gate 3 : SAST avec Semgrep

### Exercice 4.1 — Semgrep avec annotations PR (GitHub Actions)

**Réponse (élève) — PLACEHOLDER complétés**

- **`container.image:`**  
  → `returntocorp/semgrep` (image Docker officielle Semgrep)

- **`--config` (packs de règles)**  
  → `p/owasp-top-ten` (règles OWASP Top 10)  
  → `p/secrets` (détection de secrets)  
  → `.semgrep/custom-rules.yaml` (règles personnalisées du TP1)

- **`--output`**  
  → `semgrep-results.sarif` (fichier de sortie SARIF)

- **`--severity`**  
  → `ERROR` (seulement les findings de sévérité ERROR feront échouer le job)

- **`sarif_file:`**  
  → `semgrep-results.sarif`

**Comportement attendu :**
- Semgrep scanne le code avec les règles OWASP + secrets + custom
- Si finding ERROR détecté → job échoue
- SARIF uploadé crée des annotations sur les lignes de code dans les PR

Implémentation : [devsecops.yml](.github/workflows/devsecops.yml#L68-L94)

### Exercice 4.2 — Variante GitLab CI (réponse théorique)

**Réponse (élève)**

Si j'implémentais Semgrep en GitLab CI :

- **`SEMGREP_RULES:`**  
  → `p/owasp-top-ten p/secrets .semgrep/custom-rules.yaml` (liste des packs séparés par espace)

⚠️ Dans mon projet, je n'implémente que GitHub Actions.

---

### Exercice 4.3 — Comprendre les annotations et ajuster les règles

**Question 16 : Combien de findings Semgrep votre pipeline a-t-il détectés ? Avec quelle sévérité ?**

RÉPONSE :
**0 findings détectés** (commit 331ec43, job SAST réussi en 7 secondes)

Détails du scan :
- 203 règles exécutées (Community + Custom)
- 11 fichiers scannés (limité aux fichiers trackés par git)
- 2 fichiers ignorés via .semgrepignore (node_modules/, Dockerfile)
- 1 fichier >1MB skippé

Pourquoi 0 findings malgré app.js vulnérable ?
→ Les règles custom (`.semgrep/custom-rules.yaml`) utilisent des patterns trop spécifiques qui ne matchent pas le code réel. Par exemple :
- Règle `password = "admin"` ne matche pas `const adminPassword = "admin";`
- Les packs p/owasp-top-ten et p/secrets n'ont pas détecté les vulnérabilités dans ce code minimal.

**Question 17 : Les annotations apparaissent-elles sur les lignes de code dans la PR ? Montrez une capture.**

RÉPONSE :
Pas d'annotations car 0 findings détectés. Pour tester les annotations Semgrep :
1. Améliorer les règles custom pour détecter réellement les vulnérabilités
2. Créer une Pull Request avec du code vulnérable
3. Les findings apparaîtraient alors comme annotations sur les lignes concernées via l'onglet Security > Code scanning alerts

Le SARIF a bien été uploadé vers GitHub Security tab (catégorie: semgrep-sast).

**Question 18 : Identifiez au moins 1 faux positif. Comment écrire une règle d'exclusion (noqa comment ou .semgrepignore) ?**

RÉPONSE :
Aucun faux positif détecté (0 findings). Mais voici comment gérer les faux positifs :

**Méthode 1 - Commentaire inline** :
```javascript
const password = "admin"; // nosemgrep: hardcoded-admin-password
```

**Méthode 2 - .semgrepignore** (déjà créé) :
```
node_modules/
.git/
Dockerfile
package*.json
```
Syntaxe identique à .gitignore (patterns glob).

**Méthode 3 - Configuration dans la règle** :
Ajouter `paths.exclude` dans la règle YAML pour ignorer certains chemins.

**Question 19 : Comparez le temps d'exécution Semgrep vs OWASP Dep-Check. Lequel est plus rapide ? Pourquoi ?**

RÉPONSE :
**Semgrep : 7 secondes** (commit 331ec43)  
**OWASP Dependency-Check : 40 secondes** (commit 7b0cd2e, sans cache)

**Semgrep est 5-6× plus rapide.**

Raisons :
1. **Semgrep** : Analyse syntaxique locale (AST pattern matching) sur le code source, pas de réseau requis
2. **OWASP Dep-Check** : Doit télécharger et interroger des bases NVD externes, parser les manifests (package.json, pom.xml), calculer les hashes

→ Semgrep = SAST statique rapide  
→ Dependency-Check = SCA avec dépendances réseau (BD de vulnérabilités)

---
