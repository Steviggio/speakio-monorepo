# Speakio Agent — API Reference

> **Base URL** : `http://localhost:3010`
> **Version** : `0.1.0`
> **Protocole** : HTTP/JSON + SSE (Server-Sent Events)

---

## Table des matières

- [Authentification](#authentification)
- [Routes Internes (Ops)](#routes-internes-ops)
  - [GET /internal/health](#get-internalhealth)
  - [GET /internal/ready](#get-internalready)
  - [GET /internal/metrics](#get-internalmetrics)
- [Routes Agent (Auth requise)](#routes-agent-auth-requise)
  - [POST /v1/agent/chat](#post-v1agentchat)
  - [POST /v1/agent/recommendations](#post-v1agentrecommendations)
  - [POST /v1/agent/explain](#post-v1agentexplain)
- [Routes Profil Utilisateur (Auth requise)](#routes-profil-utilisateur-auth-requise)
  - [POST /v1/users/profile](#post-v1usersprofile)
- [Routes Admin (Auth + rôle ADMIN)](#routes-admin-auth--rôle-admin)
  - [POST /internal/ingestion/url](#post-internalingestionurl)
  - [POST /internal/ingestion/batch](#post-internalingestionbatch)
- [Codes d'erreur](#codes-derreur)

---

## Authentification

Toutes les routes `/v1/*` et `/internal/ingestion/*` nécessitent un **JWT Bearer Token** dans l'en-tête `Authorization`.

Le token JWT est émis par le backend NestJS et partagé via le même `JWT_SECRET` (HMAC HS256).

**Format attendu :**

```
Authorization: Bearer <token>
```

**Claims JWT requises :**

| Claim   | Type   | Description                            |
|---------|--------|----------------------------------------|
| `sub`   | string | UUID de l'utilisateur                  |
| `email` | string | Email de l'utilisateur                 |
| `role`  | string | Rôle (`USER`, `ADMIN`)                 |
| `iat`   | number | Timestamp d'émission                   |
| `exp`   | number | Timestamp d'expiration                 |

**Exemple de génération (dev uniquement) :**

```bash
# Secret partagé : speakio_super_secret_dev_key
# Payload : {"sub":"<USER_UUID>","email":"user@speakio.io","role":"ADMIN","iat":...,"exp":...}
```

---

## Routes Internes (Ops)

> Ces routes ne nécessitent **aucune authentification**. Elles sont destinées aux sondes de liveness/readiness et au scraping Prometheus.

---

### GET /internal/health

Vérifie la connectivité avec PostgreSQL et Redis. Utilisé par les sondes de monitoring.

**Réponse** `200 OK` | `503 Service Unavailable`

```json
{
  "status": "ok",
  "version": "0.1.0",
  "postgres": "ok",
  "redis": "ok"
}
```

**Exemple :**

```bash
curl http://localhost:3010/internal/health
```

**Réponse dégradée :**

```json
{
  "status": "degraded",
  "version": "0.1.0",
  "postgres": "error: connection refused",
  "redis": "ok"
}
```

---

### GET /internal/ready

Sonde de readiness pour les orchestrateurs (Docker, K8s). Vérifie uniquement PostgreSQL.

**Réponses :**

| Status | Body     | Description         |
|--------|----------|---------------------|
| `200`  | `ok`     | Service prêt        |
| `503`  | `not ready` | PostgreSQL indisponible |

**Exemple :**

```bash
curl http://localhost:3010/internal/ready
```

---

### GET /internal/metrics

Expose les métriques Prometheus au format OpenMetrics.

**Exemple :**

```bash
curl http://localhost:3010/internal/metrics
```

**Réponse** (extrait) :

```
# HELP go_goroutines Number of goroutines
# TYPE go_goroutines gauge
go_goroutines 12
...
```

---

## Routes Agent (Auth requise)

> Pipeline complet : Context Building → Embedding → Retrieval (Dense + Lexical) → Reranking → Prompt Building → LLM Generation

---

### POST /v1/agent/chat

Point d'entrée principal du chat conversationnel. Supporte le streaming SSE et le mode non-streaming.

**Headers :**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**

| Champ            | Type    | Requis | Validation                                          | Description                          |
|------------------|---------|--------|------------------------------------------------------|--------------------------------------|
| `message`        | string  | ✅     | `min=1, max=2000`                                   | Message de l'utilisateur             |
| `pageContext`    | string  | ❌     | `oneof: roadmap, exercise, exploration, profile`    | Page courante du frontend            |
| `goalSlug`       | string  | ❌     | `max=100`                                           | Thème de travail actuel              |
| `targetLanguage` | string  | ❌     | `max=10`                                            | Code langue (ex: `en`, `es`, `de`)   |
| `stream`         | boolean | ❌     | —                                                    | Active le streaming SSE              |

#### Mode non-streaming

**Exemple :**

```bash
curl -X POST http://localhost:3010/v1/agent/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explique-moi le present perfect en anglais",
    "targetLanguage": "en",
    "pageContext": "roadmap",
    "goalSlug": "grammar",
    "stream": false
  }'
```

**Réponse** `200 OK` :

```json
{
  "content": "Le present perfect est une structure verbale importante pour décrire des actions ou des événements qui ont eu lieu dans le passé mais qui ont une **importance sur le présent**.\n\n### Structure\n**Have/Has + Past Participle**\n\n### Exemples\n- I **have seen** that movie twice.\n- She **has visited** Paris three times.\n..."
}
```

#### Mode streaming (SSE)

```bash
curl -X POST http://localhost:3010/v1/agent/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "message": "What is the difference between much and many?",
    "targetLanguage": "en",
    "stream": true
  }'
```

**Réponse** — Flux SSE (`Content-Type: text/event-stream`) :

```
data: {"content":"\"Much\""}

data: {"content":" et "}

data: {"content":"\"many\""}

data: {"content":" sont deux quantificateurs..."}

data: [DONE]
```

---

### POST /v1/agent/recommendations

Génère des recommandations structurées de ressources d'apprentissage basées sur le profil de l'apprenant et les documents ingérés.

**Headers :**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**

| Champ            | Type   | Requis | Validation                                    | Description                         |
|------------------|--------|--------|------------------------------------------------|-------------------------------------|
| `targetLanguage` | string | ✅     | `max=10`                                      | Code langue cible                   |
| `topic`          | string | ❌     | `max=100`                                     | Thème demandé                       |
| `cefrLevel`      | string | ❌     | `oneof: A1, A2, B1, B2, C1, C2`              | Niveau CECRL souhaité               |
| `format`         | string | ❌     | `oneof: dialogue, lesson, exercise, vocabulary`| Format préféré                     |

**Exemple :**

```bash
curl -X POST http://localhost:3010/v1/agent/recommendations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "targetLanguage": "en",
    "topic": "present perfect",
    "cefrLevel": "B1",
    "format": "exercise"
  }'
```

**Réponse** `200 OK` :

```json
{
  "advice": "Pour maîtriser le present perfect au niveau B1, concentre-toi sur les marqueurs temporels (already, yet, since, for) et les verbes irréguliers courants.",
  "resources": [
    {
      "title": "Present Perfect - EnglishPage",
      "reason": "Explications claires avec exercices interactifs, idéal pour ton niveau.",
      "difficulty": "B1"
    },
    {
      "title": "Present Perfect vs Past Simple",
      "reason": "Distinguer ces deux temps est essentiel au niveau B1.",
      "difficulty": "B1-B2"
    }
  ],
  "vocabulary": [
    {
      "term": "already",
      "meaning": "déjà",
      "example": "I have already finished my homework."
    },
    {
      "term": "yet",
      "meaning": "encore / déjà (négatif/interrogatif)",
      "example": "Have you finished yet?"
    }
  ]
}
```

---

### POST /v1/agent/explain

Génère une explication détaillée d'un concept grammatical ou linguistique, adaptée au niveau CECRL de l'utilisateur.

**Headers :**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**

| Champ            | Type   | Requis | Validation                         | Description                       |
|------------------|--------|--------|------------------------------------|-----------------------------------|
| `topic`          | string | ✅     | `max=200`                         | Concept à expliquer               |
| `targetLanguage` | string | ✅     | `max=10`                          | Code langue                       |
| `cefrLevel`      | string | ❌     | `oneof: A1, A2, B1, B2, C1, C2`  | Niveau CECRL pour l'adaptation    |

**Exemple :**

```bash
curl -X POST http://localhost:3010/v1/agent/explain \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "subjunctive mood",
    "targetLanguage": "es",
    "cefrLevel": "B2"
  }'
```

**Réponse** `200 OK` :

```json
{
  "content": "## Le subjonctif en espagnol (El Subjuntivo)\n\nLe subjonctif est un mode verbal utilisé pour exprimer des désirs, des doutes, des émotions ou des hypothèses.\n\n### Formation\n- **Présent du subjonctif** : Radical du verbe + terminaisons (-e, -es, -e, -emos, -éis, -en pour -ar)\n\n### Déclencheurs courants\n- **Querer que** : Quiero que vengas. (Je veux que tu viennes.)\n- **Es importante que** : Es importante que estudies. (Il est important que tu études.)\n\n### Erreurs fréquentes\n- ❌ *Quiero que vienes* → ✅ *Quiero que vengas*\n..."
}
```

---

## Routes Profil Utilisateur (Auth requise)

---

### POST /v1/users/profile

Crée ou met à jour le profil linguistique de l'utilisateur authentifié. L'identifiant utilisateur est extrait du JWT.

**Headers :**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**

| Champ                    | Type     | Requis | Validation                                  | Description                       |
|--------------------------|----------|--------|----------------------------------------------|-----------------------------------|
| `targetLanguage`         | string   | ✅     | `min=2, max=10`                             | Code ISO de la langue cible       |
| `cefrLevel`              | string   | ✅     | `oneof: A1, A2, B1, B2, C1, C2, native`    | Niveau CECRL estimé               |
| `preferredResourceTypes` | string[] | ❌     | —                                            | Types préférés (ex: `["video", "article"]`) |

**Exemple :**

```bash
curl -X POST http://localhost:3010/v1/users/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "targetLanguage": "en",
    "cefrLevel": "B1",
    "preferredResourceTypes": ["video", "exercise", "article"]
  }'
```

**Réponse** `200 OK` :

```json
{
  "status": "ok"
}
```

---

## Routes Admin (Auth + rôle ADMIN)

> Ces routes nécessitent un JWT avec `"role": "ADMIN"`. Elles déclenchent le pipeline d'ingestion : Fetch → Clean → Markdown → Chunk → Enrich → Embed → Persist.

---

### POST /internal/ingestion/url

Ingère une URL unique de manière synchrone. Le contenu est extrait, nettoyé, découpé en chunks, enrichi avec des métadonnées pédagogiques, vectorisé et persisté dans pgvector.

**Headers :**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**

| Champ      | Type   | Requis | Validation         | Description                    |
|------------|--------|--------|--------------------|--------------------------------|
| `url`      | string | ✅     | URL valide         | URL à ingérer                  |
| `language` | string | ❌     | `max=10`           | Code langue du contenu         |

**Exemple :**

```bash
curl -X POST http://localhost:3010/internal/ingestion/url \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.englishpage.com/verbpage/presentperfect.html",
    "language": "en"
  }'
```

**Réponse** `200 OK` :

```json
{
  "status": "ingested",
  "url": "https://www.englishpage.com/verbpage/presentperfect.html"
}
```

**Comportement :**

- Les contenus dupliqués (même checksum) sont automatiquement ignorés
- Les chunks sont enrichis avec : `category`, `topic`, `cefr_level`, `difficulty_score`, `keywords`
- Les embeddings sont générés via le modèle configuré (`qwen3-embedding:0.6b`, dim=1024)
- L'index HNSW est mis à jour pour la recherche vectorielle

---

### POST /internal/ingestion/batch

Enregistre plusieurs URLs en file d'attente Redis pour un traitement asynchrone par le worker.

**Headers :**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**

| Champ  | Type     | Requis | Validation          | Description                     |
|--------|----------|--------|---------------------|---------------------------------|
| `urls` | array    | ✅     | `min=1, max=50`     | Liste d'URLs à ingérer          |
| `urls[].url` | string | ✅ | URL valide          | URL du contenu                  |
| `urls[].language` | string | ❌ | `max=10`       | Code langue                     |

**Exemple :**

```bash
curl -X POST http://localhost:3010/internal/ingestion/batch \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      {"url": "https://www.englishpage.com/verbpage/presentperfect.html", "language": "en"},
      {"url": "https://www.englishpage.com/verbpage/pastperfect.html", "language": "en"},
      {"url": "https://www.spanishdict.com/guide/subjunctive", "language": "es"}
    ]
  }'
```

**Réponse** `202 Accepted` :

```json
{
  "status": "queued",
  "queued": 3,
  "total": 3
}
```

---

## Codes d'erreur

Toutes les erreurs sont retournées au format JSON :

```json
{
  "error": "<error_code>"
}
```

### Codes HTTP et erreurs

| HTTP Status | Code d'erreur         | Description                                     |
|-------------|----------------------|-------------------------------------------------|
| `400`       | `invalid_payload`    | Corps de la requête JSON invalide ou malformé    |
| `401`       | `missing authorization header` | En-tête `Authorization` absent          |
| `401`       | `invalid authorization format` | Format incorrect (attendu: `Bearer <token>`) |
| `401`       | `invalid or expired token`     | JWT invalide, expiré ou mal signé         |
| `403`       | `admin_required`     | Le rôle ADMIN est requis pour cette route        |
| `422`       | `validation_error`   | Le body ne respecte pas les contraintes de validation |
| `429`       | (rate limit)         | Trop de requêtes (limite : 60 req/min par défaut) |
| `500`       | `agent_error`        | Erreur interne du pipeline IA                    |
| `500`       | `ingestion_error`    | Erreur pendant l'ingestion d'une URL             |
| `500`       | `database_error`     | Erreur de persistance en base de données         |
| `503`       | `not ready`          | Service non prêt (PostgreSQL indisponible)       |

---

## Configuration

Variables d'environnement pertinentes pour l'API :

| Variable            | Default                      | Description                        |
|---------------------|------------------------------|------------------------------------|
| `PORT`              | `3010`                       | Port d'écoute HTTP                 |
| `VLLM_BASE_URL`     | `http://localhost:11434`     | URL du serveur Ollama              |
| `VLLM_MODEL`        | `qwen3.5:0.8b`              | Modèle LLM utilisé                |
| `EMBEDDING_URL`     | `http://localhost:11434`     | URL du service d'embedding         |
| `EMBEDDING_MODEL`   | `qwen3-embedding:0.6b`      | Modèle d'embedding                 |
| `EMBEDDING_DIM`     | `1024`                       | Dimension des vecteurs             |
| `DATABASE_URL`      | —                            | URL PostgreSQL (pgvector)          |
| `REDIS_URL`         | `redis://localhost:6379`     | URL Redis                          |
| `JWT_SECRET`        | —                            | Secret HMAC partagé avec NestJS    |
| `RATE_LIMIT_RPM`    | `60`                         | Limite de requêtes par minute      |
| `MAX_RETRIEVAL_CHUNKS` | `6`                       | Nombre max de chunks RAG           |
| `LLM_TIMEOUT`       | `60s`                        | Timeout pour les appels LLM        |
| `EMBEDDING_TIMEOUT`  | `10s`                       | Timeout pour les embeddings        |
