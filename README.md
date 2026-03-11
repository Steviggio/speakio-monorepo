<h1 align="center">
  🚀 Speakio Template (Turborepo)
</h1>

<p align="center">
  A production-ready full-stack Monorepo template powered by Next.js, NestJS, MongoDB, and Turborepo.
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-black?logo=next.js&style=flat-square" />
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS-10-ea2845?logo=nestjs&style=flat-square" />
  <img alt="Turborepo" src="https://img.shields.io/badge/Turborepo-2-ef4444?logo=turborepo&style=flat-square" />
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&style=flat-square" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&style=flat-square" />
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&style=flat-square" />
</p>

---

## 🏗 Architecture

This repository uses a **Monorepo** architecture managed by [Turborepo](https://turbo.build/). It is designed for high performance, shared types, and robust scalability.

- `apps/web`: The Frontend application built with **Next.js (App Router)** and Tailwind CSS.
- `apps/api`: The Backend API built with **NestJS**, serving as a robust server-side foundation.
- `packages/types`: Shared TypeScript interfaces (`User`, `Resource`, etc.) used across both frontend and backend for end-to-end type safety.
- `docker/docker-compose.yml`: Local infrastructure including **MongoDB** and **Nginx** (useful for reverse proxying in production-like setups).
- `scripts/`: Useful utility scripts for database seeding and administration.

## ✨ Features

- **End-to-End Type Safety**: Share core domain models between Next.js and NestJS seamlessly via `/packages/types`.
- **Ultra-Fast Builds**: Leveraging Turborepo's smart caching and parallel execution.
- **Dockerized Environment**: Ready-to-go `docker/docker-compose.yml` for zero-configuration database spin-up.
- **Authentication**: Pre-configured JWT access and refresh token strategy + integration points for Google OAuth.
- **Modern UI**: Polished Next.js frontend with Tailwind CSS, supporting internationalization (i18n).
- **MCP Integrations**: Includes scripts to leverage Model Context Protocol (Playwright, GitHub, MongoDB) for AI-driven assistance out-of-the-box.

## 🚀 Getting Started

### 1. Prerequisites

Make sure you have installed the following on your machine:
- [Node.js](https://nodejs.org/en) (v18 or higher)
- [Docker & Docker Compose](https://www.docker.com/) (for MongoDB & Nginx)
- npm, yarn, or pnpm

### 2. Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/YOUR_USERNAME/speakio-template.git
cd speakio-template
npm install
```

### 3. Environment Variables

Create the required `.env` files based on their respective `.env.example` equivalents (if available) or copy the provided defaults:

```bash
# General environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```
*(Make sure to define `MONGO_URI`, `JWT_SECRET`, etc. in your backend `.env` file!)*

### 4. Start Local Infrastructure (Docker)

To run the local MongoDB database and Nginx proxy, rely on Docker Compose:

```bash
docker-compose -f docker/docker-compose.yml up -d
```
*Note: Make sure your local MongoDB instance is not already running on port 27017 or 27018 to avoid collisions.*

### 5. Run the Application

You can start both the frontend and the backend simultaneously using Turborepo from the root directory:

```bash
npm run dev
```

- **Frontend (Next.js)**: [http://localhost:3000](http://localhost:3000)
- **Backend (NestJS API)**: [http://localhost:3001/api](http://localhost:3001/api)

## 🛠 Available Scripts

From the root `package.json`, you can run the following Turbo commands:

- `npm run dev`: Starts all applications in development mode with hot-reloading.
- `npm run build`: Builds all packages and applications for production.
- `npm run lint`: Lints all applications using ESLint.
- `npm run format`: Formats the codebase using Prettier.
- `npm run clean`: Cleans the `.turbo` cache, `node_modules`, and build artifacts.

## 🤝 Contributing

We welcome contributions! Please follow these steps when contributing:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

Make sure your code passes the strict CI/CD linting checks by running `npm run build` and `npm run lint` locally before opening your PR.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
