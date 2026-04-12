<h1 align="center">
  🚀 Speakio Template (Turborepo)
</h1>

<p align="center">
  Un template Monorepo full-stack prêt pour la production, propulsé par Next.js, NestJS, MongoDB et Turborepo.
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-black?logo=next.js&style=flat-square" />
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS-10-ea2845?logo=nestjs&style=flat-square" />
  <img alt="Turborepo" src="https://img.shields.io/badge/Turborepo-2-ef4444?logo=turborepo&style=flat-square" />
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&style=flat-square" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&style=flat-square" />
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&style=flat-square" />
  <a href="README.md"><img alt="English" src="https://img.shields.io/badge/Language-English-blue?style=flat-square" /></a>
</p>

---

## 🏗 Architecture

Ce dépôt utilise une architecture **Monorepo** gérée par [Turborepo](https://turbo.build/). Il est conçu pour offrir de hautes performances, un partage de types natif et une scalabilité robuste.

- `apps/web` : L'application Frontend développée avec **Next.js (App Router)** et Tailwind CSS.
- `apps/api` : L'API Backend développée avec **NestJS**, servant de base serveur extrêmement robuste.
- `packages/types` : Les interfaces TypeScript partagées (`User`, `Resource`, etc.) utilisées à la fois par le frontend et le backend pour garantir le typage de bout-en-bout.
- `docker/docker-compose.yml` : L'infrastructure locale incluant **MongoDB** et **Nginx** (très utile pour paramétrer un reverse proxy en environnement de type production).
- `scripts/` : Des scripts utilitaires pratiques pour l'alimentation de la base de données (seeding) et l'administration.

## ✨ Fonctionnalités

- **Suivi de Type de Bout-en-Bout (Type Safety)** : Partage fluide des modèles de base de données entre Next.js et NestJS via `/packages/types`.
- **Compilations Ultra-Rapides** : Tirant parti de la mise en cache intelligente et de l'exécution parallèle de Turborepo.
- **Environnement Docker** : Le fichier `docker/docker-compose.yml` est prêt à l'emploi pour lancer des bases de données sans aucune configuration locale préalable.
- **Authentification** : Stratégie native par jetons JWT (access & refresh tokens) pré-configurée, prête à l'emploi avec point d'intégration pour Google OAuth.
- **Interface Moderne** : Frontend Next.js poli avec Tailwind CSS, prenant en charge l'internationalisation (i18n).
- **Intégrations MCP** : Inclut des scripts permettant d'utiliser le protocole Model Context Protocol (Playwright, GitHub, MongoDB) pour une assistance via Intelligence Artificielle native.

## 🚀 Guide de Démarrage

### 1. Pré-requis

Assurez-vous d'avoir installé les outils suivants sur votre machine :

- [Node.js](https://nodejs.org/fr) (v18 ou supérieur)
- [Docker & Docker Compose](https://www.docker.com/) (pour lancer MongoDB & Nginx)
- npm, yarn, ou pnpm

### 2. Installation

Clonez le dépôt puis installez les dépendances :

```bash
git clone https://github.com/VOTRE_NOM_DUTILISATEUR/speakio-template.git
cd speakio-template
npm install
```

### 3. Variables d'Environnement

Créez les fichiers `.env` nécessaires en vous basant sur leurs équivalents `.env.example` (s'ils sont disponibles) ou copiez les valeurs par défaut :

```bash
# Variables d'environnement par défaut
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

_(N'oubliez pas de configurer `MONGO_URI`, `JWT_SECRET`, etc. dans le fichier `.env` de votre backend !)_

### 4. Démarrer l'Infrastructure Locale (Docker)

Pour lancer la base de données locale MongoDB ainsi que le proxy Nginx, utilisez Docker Compose :

```bash
docker-compose -f docker/docker-compose.yml up -d
```

_Note : Assurez-vous que vous n'avez pas déjà une instance locale de MongoDB qui tourne sur les ports 27017 ou 27018 afin d'éviter tout conflit._

### 5. Lancer l'Application

Vous pouvez lancer le frontend et le backend de manière simultanée à l'aide de Turborepo, directement depuis la racine du projet :

```bash
npm run dev
```

- **Frontend (Next.js)** : [http://localhost:3000](http://localhost:3000)
- **Backend (API NestJS)** : [http://localhost:3001/api](http://localhost:3001/api)

## 🛠 Commandes Disponibles

Depuis le fichier `package.json` situé à la racine, vous pouvez lancer les commandes Turbo suivantes :

- `npm run dev` : Démarre toutes les applications en mode développement.
- `npm run build` : Compile tous les paquets et applications pour la production.
- `npm run lint` : Vérifie la qualité du code (linting) via ESLint.
- `npm run format` : Formate le code source avec Prettier.
- `npm run clean` : Nettoie le cache `.turbo`, supprime les `node_modules` et les artefacts de compilation.

## 🤝 Contribution

Les contributions sont toujours les bienvenues ! Veuillez suivre ces étapes pour contribuer :

1. Créez un _fork_ du dépôt.
2. Créez votre branche de fonctionnalité (`git checkout -b feature/IncroyableFonctionnalite`).
3. Appliquez vos modifications via un commit (`git commit -m 'Ajout d'une IncroyableFonctionnalite'`).
4. Poussez vos modifications sur la nouvelle branche (`git push origin feature/IncroyableFonctionnalite`).
5. Ouvrez formellement une Pull Request.

Avant d'ouvrir votre PR, assurez-vous de passer les tests de lint strict en lançant localement `npm run build` et `npm run lint`.

## 📝 Licence

Ce projet est sous licence MIT - consultez le fichier [LICENSE](LICENSE) pour plus de détails.
