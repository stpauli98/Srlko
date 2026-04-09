# Srlko

Real-time chat and 1-on-1 audio call platform (Slack / Discord style).

## Stack

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS + Zustand
- **Backend:** Node.js 22 + Express + Socket.io + Prisma
- **Database:** PostgreSQL
- **Real-time chat:** Socket.io
- **Voice calls:** WebRTC (Socket.io as signaling server)

## MVP features

- Email / password auth (JWT)
- Channels (public + private, grouped chat)
- Direct messages with read receipts and reactions
- Message search
- 1-on-1 audio calls ("huddles")
- Presence (online / offline)
- Unreads inbox
- Mobile-responsive layout

## Local development

```bash
# 1. Start Postgres
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env             # edit JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run db:seed                  # optional: creates alice@srlko.dev / bob@srlko.dev (pw: password123)
npm run dev                      # http://localhost:3000

# 3. Frontend (in a second terminal)
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

## Deployment

- **Frontend:** Vercel (uses `vercel.json`)
- **Backend:** Railway (uses `backend/railway.json`)
- **Database:** Neon or Supabase (both free)

Set env vars:

- **Vercel:** `VITE_API_URL` → `https://your-backend.up.railway.app`
- **Railway:** `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` → `https://your-app.vercel.app`

## Attribution

Derived from [ncvgl/slawk](https://github.com/ncvgl/slawk) (MIT). See `LICENSE`.
