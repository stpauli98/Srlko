# Srlko Backend

Backend API for Srlko — real-time chat + 1-on-1 audio call platform.

## Stack

- Node.js 22 + TypeScript
- Express 5
- Socket.io (chat + WebRTC signaling)
- Prisma ORM
- PostgreSQL
- JWT auth

## Setup

```bash
cp .env.example .env      # edit JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run db:seed           # optional: seed alice@srlko.dev / bob@srlko.dev
npm run dev               # http://localhost:3000
```

## Env vars

| Var | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string (append `?sslmode=require` in prod) |
| `JWT_SECRET` | yes (prod) | ≥32 chars; generate with `openssl rand -hex 32` |
| `PORT` | no | Defaults to `3000`; Railway auto-sets this |
| `NODE_ENV` | no | `development` / `production` / `test` |
| `CORS_ORIGIN` | no | Comma-separated list of allowed origins; defaults to `http://localhost:5173` in dev |

## Scripts

- `npm run dev` — dev server with auto-reload
- `npm run build` — compile TypeScript to `dist/`
- `npm run start` — run compiled build (production)
- `npm run db:migrate` — create a new Prisma migration
- `npm run db:generate` — regenerate Prisma client
- `npm run db:seed` — seed dev users and channels
- `npm run db:studio` — open Prisma Studio
