# ShimaHome Monorepo

This repository hosts the ShimaHome platform: tenant–landlord marketplace, payments/escrow, maintenance, and operations.

## Structure
- apps/web: Next.js web app (tenant + landlord portal)
- services/api: Backend API (NestJS)
- packages/shared: Shared types/config
- infra/: Local/dev infra (Docker Compose, IaC later)
- scripts/: Utilities for dev/migrations/seed

## Getting Started (Local)
1. Copy env
```
cp .env.example .env
```
2. Start infra (Postgres, Redis)
```
docker compose -f infra/docker-compose.yml up -d
```
3. (Upcoming) Install deps and start apps
```
npm install
npm run dev
```

## Notes
- Do not commit secrets. Use `.env` locally and secret managers in cloud.
- This is a scaffold; services will be added incrementally.

## Frontend Deployment (Vercel)
Deploy the Next.js web app using Vercel. The project is a monorepo; set the root to `apps/web/` when importing.

1. Push this repository to GitHub/GitLab.
2. In Vercel, import the repo and set Root Directory to `apps/web/`.
3. Build command: `npm run build`
4. Install command: `npm install` (monorepo workspaces are configured at root)
5. No env vars required for mock API. Deploy.

## Local Production Build (Web)
To verify a production build locally for the web app:

```
npm run build --workspace @shimahome/web
npm run start --workspace @shimahome/web
```
