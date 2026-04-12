# Speakio — Stack Technique & Fonctionnalités

> Répertoire communautaire de ressources pour l'apprentissage des langues.

Ce projet est structuré sous forme de **Monorepo** utilisant [Turborepo](https://turbo.build/repo). L'ensemble du code est développé en **TypeScript**.

---

## 🏗 Architecture Globale

| Composant | Technologie |
|-----------|-------------|
| **Monorepo** | Turborepo + npm workspaces |
| **Langage** | TypeScript (strict) |
| **Linter / Formatter** | ESLint & Prettier |
| **Infrastructure** | Docker Compose (10 services) |
| **Reverse Proxy** | Nginx |
| **CI/CD** | Docker multi-stage builds |

---

## 🎨 Frontend (`apps/web`)

Application web moderne construite avec l'App Router de Next.js, offrant SSR, routing client, et une interface entièrement bilingue (FR/EN).

### Technologies

| Catégorie | Technologie |
|-----------|-------------|
| **Framework** | [Next.js](https://nextjs.org/) v16 (App Router) |
| **UI Library** | [React](https://react.dev/) v19 |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) v4 |
| **Composants UI** | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| **Data Fetching** | [TanStack React Query](https://tanstack.com/query/latest) |
| **Client HTTP** | Axios |
| **Formulaires** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **Internationalisation** | Système i18n custom (FR/EN) |
| **Icônes** | Lucide React |
| **Analytics** | [Umami](https://umami.is/) (script sans cookies) |
| **Tests** | [Vitest](https://vitest.dev/) + React Testing Library |

### Fonctionnalités

- **Catalogue de ressources** — Recherche, filtres par type/pricing/langue, pagination
- **Système de votes** — Upvote/downvote sur les ressources
- **Favoris** — Sauvegarde de ressources pour accès rapide
- **Blog** — Rédaction d'articles en Markdown, tags, brouillons
- **Commentaires** — Sur les ressources et articles, avec pagination
- **Roadmaps** — Parcours d'apprentissage personnalisés (étapes, sous-étapes, vocabulaires)
- **Profil utilisateur** — Avatar, bio, langues en apprentissage
- **Paramètres** — Modification email/mot de passe, préférences d'interface, suppression de compte
- **Authentification** — Inscription/connexion (email + Google OAuth)
- **Pages légales** — Politique de confidentialité, CGU, mentions légales (bilingues)
- **Consentement RGPD** — Checkbox obligatoire à l'inscription avec liens vers les pages légales
- **SEO** — Metadata, Open Graph, sitemap, robots.txt

---

## ⚙️ Backend (`apps/api`)

API REST robuste et modulaire construite avec NestJS, suivant une architecture en modules avec guards, interceptors, pipes, et filtres globaux.

### Technologies

| Catégorie | Technologie |
|-----------|-------------|
| **Framework** | [NestJS](https://nestjs.com/) v11 |
| **Base de données** | MongoDB 7 |
| **ODM** | [Mongoose](https://mongoosejs.com/) v9 |
| **Authentification** | [Passport.js](https://www.passportjs.org/) (JWT + Google OAuth 2.0) |
| **Validation** | `class-validator` + `class-transformer` + [Joi](https://joi.dev/) |
| **Sécurité** | Helmet, bcryptjs, CORS, Rate Limiting (`@nestjs/throttler`) |
| **Métriques** | [prom-client](https://github.com/siimon/prom-client) (Prometheus) |
| **Tests** | [Jest](https://jestjs.io/) + Supertest |

### Fonctionnalités

- **Auth** — Register, login, Google OAuth, forgot/reset password, change email/password
- **RBAC** — Role-Based Access Control (`USER` / `ADMIN`) via `RolesGuard`
- **CRUD complet** — Resources, Posts, Comments, Roadmaps, Votes, Favorites, Users
- **Pagination centralisée** — Helper réutilisable sur toutes les collections
- **Upload d'avatars** — Validation type/taille, stockage filesystem
- **Import de ressources** — Normalisation, classification, quality scoring
- **Export CSV** — Export des roadmaps au format Anki
- **Export de données RGPD** — `GET /api/users/me/export` (portabilité Art. 20)
- **Suppression RGPD** — Anonymisation complète du compte + cascade (posts, commentaires, roadmaps, votes)
- **Consentement traçable** — Horodatage + version des CGU acceptées
- **Métriques Prometheus** — `http_requests_total`, `http_request_duration_seconds`, métriques Node.js
- **Rate Limiting** — 100 requêtes/minute par IP
- **Réponses standardisées** — `TransformInterceptor` + `HttpExceptionFilter`

---

## 📦 Packages partagés (`packages/`)

| Package | Rôle |
|---------|------|
| `@repo/types` | Types et interfaces TypeScript partagés (User, Resource, Post, etc.) |
| `@repo/eslint-config` | Configuration ESLint commune |
| `@repo/typescript-config` | Configuration tsconfig commune |

---

## 🐳 Infrastructure Docker

L'application est entièrement conteneurisée avec 10 services orchestrés par Docker Compose.

### Services applicatifs

| Service | Image | Port | Rôle |
|---------|-------|------|------|
| `speakio-mongo` | `mongo:7` | 27018 | Base de données MongoDB |
| `speakio-api` | Build local | 3001 | Backend NestJS |
| `speakio-web` | Build local | 3000 | Frontend Next.js |
| `speakio-nginx` | `nginx:alpine` | 80 | Reverse proxy & routage |

### Services d'observabilité

| Service | Image | Port | Rôle |
|---------|-------|------|------|
| `speakio-prometheus` | `prom/prometheus:v2.51` | 9090 | Collecte de métriques (rétention 30j) |
| `speakio-grafana` | `grafana/grafana:11.0` | 3002 | Dashboards de monitoring |
| `speakio-nginx-exporter` | `nginx-prometheus-exporter:1.1` | — | Export métriques Nginx |
| `speakio-mongodb-exporter` | `percona/mongodb_exporter:0.40` | — | Export métriques MongoDB |

### Services d'analytics

| Service | Image | Port | Rôle |
|---------|-------|------|------|
| `speakio-umami` | `ghcr.io/umami-software/umami` | 3003 | Analytics web (GDPR-compliant) |
| `speakio-umami-db` | `postgres:15-alpine` | — | Base PostgreSQL dédiée à Umami |

### Routage Nginx

| URL | Destination |
|-----|-------------|
| `http://localhost/` | Frontend (Next.js) |
| `http://localhost/api/*` | Backend (NestJS) |
| `http://localhost/grafana/` | Grafana |
| `http://localhost/umami/` | Umami Analytics |

---

## 📊 Monitoring & Observabilité

### Prometheus

Collecte automatique toutes les 15 secondes avec 3 targets :
- **API NestJS** (`/api/metrics`) — latence, requêtes, heap, event loop
- **Nginx** (via exporter) — connexions actives, requêtes
- **MongoDB** (via exporter) — connexions, opérations/s, mémoire

### Grafana

Dashboard pré-provisionné "Speakio — Overview" avec 12 panels :
- **API** : Request rate, latence P50/P95/P99, erreurs par status, breakdown par route
- **Node.js** : Heap memory, event loop lag, active handles
- **Nginx** : Connexions actives (reading/writing/waiting), request rate
- **MongoDB** : Connexions, opérations/s (insert/query/update/delete), mémoire

### Umami Analytics

Analytics web self-hosted, sans cookies, conforme RGPD :
- Pages vues et sessions
- Sources de trafic et referrers
- Répartition géographique
- Navigateurs et appareils
- Événements custom

---

## 🔒 Sécurité & Conformité RGPD

### Mesures de sécurité

| Mesure | Implémentation |
|--------|---------------|
| Hashing des mots de passe | bcrypt (salt factor 10) |
| HTTPS headers | Helmet |
| CORS | Origines restreintes, credentials, méthodes whitelist |
| Rate limiting | 100 req/min par IP (Throttler) |
| JWT | Tokens signés, expiration 15 min |
| Validation des entrées | `ValidationPipe` + DTOs |
| Cookie auth | `secure`, `sameSite: lax` |
| Upload sécurisé | Validation extension + taille (5 Mo max) |

### Conformité RGPD

| Exigence | Statut |
|----------|--------|
| Politique de confidentialité | ✅ `/privacy` (FR/EN) |
| Conditions d'utilisation | ✅ `/terms` (FR/EN) |
| Mentions légales | ✅ `/legal-notice` (FR/EN) |
| Consentement traçable | ✅ Horodatage + version stockés en BDD |
| Droit à l'effacement (Art. 17) | ✅ Anonymisation complète + cascade |
| Droit à la portabilité (Art. 20) | ✅ Export JSON (profil, posts, commentaires, roadmaps, votes) |
| Minimisation des données | ✅ Aucune donnée superflue collectée |
| Cookies | ✅ Un seul cookie fonctionnel (JWT), pas de tracking |
| Analytics GDPR-compliant | ✅ Umami (sans cookies, sans données personnelles) |
