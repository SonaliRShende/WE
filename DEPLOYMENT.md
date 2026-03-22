# Deployment Guide

## Recommended setup

- Frontend: **Vercel** (fast global CDN and easy Vite deployment)
- Backend: **Render Web Service** (simple Python deploy + env management)
- Database: **MongoDB Atlas** (already compatible with your `MONGO_URI` flow)
- Plans: **Vercel Hobby + Render Free + MongoDB Atlas M0 (Free Tier)**

This repo is now prepared for this split deployment.

## 1) Deploy backend to Render

You can deploy directly using `render.yaml` in the repo root.

### Use Render Free plan

- Service type: **Web Service**
- Instance: **Free**
- Region: choose the one closest to your users
- Note: free services may sleep after inactivity and can take ~30–60s to wake up

### Render service settings

- Runtime: Python
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 180`
- Health check path: `/healthz`

### Required environment variables on Render
`
- `MONGO_URI` = your MongoDB Atlas connection string
- `OPENROUTER_API_KEY` = your OpenRouter API key
- `FRONTEND_ORIGIN` = your Vercel frontend URL (or comma-separated URLs)
  - Example: `https://your-app.vercel.app`
  - Example for preview + production:
    `https://your-app.vercel.app,https://your-app-git-main-yourteam.vercel.app`
- `FLASK_DEBUG=0`
- `FLASK_USE_RELOADER=0`
- Do **not** enable paid add-ons (Redis/Postgres) unless required

After deploy, copy backend URL (example: `https://ai-backend.onrender.com`).
https://we-ffbg.onrender.com
## 2) Deploy frontend to Vercel

- In Vercel, import the same GitHub repo.
- Plan: **Hobby (free)**
- Set project **Root Directory** to `frontend`.
- Build command: `npm run build`
- Output directory: `dist`

### Required environment variable on Vercel

- `VITE_API_BASE_URL` = your Render backend URL
  - Example: `https://ai-backend.onrender.com`

`frontend/vercel.json` already includes SPA rewrite support so React Router routes work.

### Free-tier Vercel notes

- Hobby plan is enough for this frontend
- Keep image/video assets optimized to stay within bandwidth limits
- Avoid serverless functions unless needed (your app is static + external backend)

## 2.1) MongoDB Atlas free setup

- Create an **M0 Free Cluster**
- Add database user and whitelist access:
  - for quick testing: `0.0.0.0/0`
  - for safer setup: only Render outbound IPs (if available)
- Put Atlas connection string into Render as `MONGO_URI`

## 3) Local development

Use `.env.example` files:

- Copy `backend/.env.example` to `backend/.env` and fill values.
- Copy `frontend/.env.example` to `frontend/.env`.

Set local frontend API base URL:

- `VITE_API_BASE_URL=http://127.0.0.1:5000`

## 4) Optional alternative (single platform)

If you prefer one platform for both frontend and backend:

- **Railway** is a good alternative for this project, especially if you want easier private networking and unified logs.
- Keep Vercel+Render when global frontend performance and simple static hosting are top priorities.

## 5) Cost-optimized defaults (recommended)

- Render workers: `1`
- No background workers unless mandatory
- Keep logs moderate and avoid verbose debug in production
- Use one MongoDB Atlas M0 cluster
- Keep model-heavy experiments off production service where possible

## Notes

- Backend now binds to `0.0.0.0` and uses `PORT` automatically for cloud platforms.
- Frontend API calls now use `VITE_API_BASE_URL` (no localhost hardcoding).
- CORS is controlled using `FRONTEND_ORIGIN` for safer production access.
