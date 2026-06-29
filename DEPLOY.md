# Werewolf — Deployment Guide

The app has two separate services that you deploy independently:

| Service | Tech | Recommended host |
|---------|------|-----------------|
| **Backend** (game server) | Node.js + Express + Socket.IO | Railway or Render |
| **Frontend** (Next.js UI) | Next.js 14 | Vercel |

They communicate over HTTP + WebSocket. The frontend connects to the backend via the `NEXT_PUBLIC_SOCKET_URL` environment variable.

---

## ⚠️ Known Limitation — In-Memory State

Room state is stored in memory on the backend process. If the backend **restarts** (deploy, crash, auto-sleep), all active rooms and game state are lost. Players will need to create a new room.

This is fine for friend groups. If you need persistence across restarts, a Redis adapter for Socket.IO would be required (not included).

---

## Environment Variables

### Backend — `server/.env` (copy from `server/.env.example`)

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `NODE_ENV` | Yes | `production` | Suppresses verbose logs |
| `CLIENT_ORIGIN` | Yes | `https://mygame.vercel.app` | Comma-separated for multiple origins |
| `SERVER_PORT` | No | `3001` | Local/VPS only — Railway and Render inject `PORT` automatically |

### Frontend — `client/.env.local` (copy from `client/.env.example`)

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `NEXT_PUBLIC_SOCKET_URL` | Yes | `https://mygame-server.up.railway.app` | No trailing slash |

---

## Local Development

```bash
# 1. Install all dependencies
npm run install:all

# 2. Copy and edit env files
cp server/.env.example server/.env
cp client/.env.example client/.env.local

# 3. Start both services (hot-reload)
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Health check: http://localhost:3001/health

---

## Deploy Backend to Railway

Railway is the easiest option — it auto-detects Node.js, provides a free tier, and handles `PORT` injection.

### Steps

1. Push your code to a GitHub repository.

2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.

3. Select your repository. When prompted for a root directory, set it to **`server`**.

4. Railway will detect Node.js automatically. Set the **Start Command** to:
   ```
   npm run start
   ```

5. In the Railway dashboard → **Variables**, add:
   ```
   NODE_ENV=production
   CLIENT_ORIGIN=https://your-vercel-app.vercel.app
   ```
   (You'll fill in the Vercel URL after deploying the frontend in the next section.)

6. Click **Deploy**. Railway will:
   - Run `npm install`
   - Run `npm run build` (compiles TypeScript → `dist/`)
   - Run `npm run start` (starts `node dist/index.js`)

7. Copy the Railway public URL (looks like `https://yourapp.up.railway.app`). You'll need this for the frontend.

### Railway nixpacks / build config

If Railway doesn't auto-detect the build step, add a `railway.json` in the `server/` folder:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/health"
  }
}
```

---

## Deploy Backend to Render (Alternative)

1. Go to [render.com](https://render.com) → **New Web Service** → connect your GitHub repo.

2. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: Free (or Starter for persistent uptime)

3. **Environment Variables**:
   ```
   NODE_ENV=production
   CLIENT_ORIGIN=https://your-vercel-app.vercel.app
   ```

4. Click **Create Web Service**. Copy the `*.onrender.com` URL.

> **Render Free Tier Note**: Free services sleep after 15 minutes of inactivity and take ~30 seconds to wake. The first player to visit may see a connection delay. Upgrade to Starter ($7/mo) to avoid this.

---

## Deploy Frontend to Vercel

1. Push your code to GitHub (same repo is fine — Vercel can target a sub-directory).

2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo.

3. Set the **Root Directory** to `client`.

4. Vercel auto-detects Next.js. Keep default build settings.

5. Under **Environment Variables**, add:
   ```
   NEXT_PUBLIC_SOCKET_URL=https://yourapp.up.railway.app
   ```
   (Use the Railway or Render URL from the backend deployment.)

6. Click **Deploy**.

7. Copy the Vercel URL (e.g. `https://werewolf-game.vercel.app`).

8. **Go back to your backend** (Railway or Render) and update `CLIENT_ORIGIN` to this Vercel URL, then redeploy the backend.

---

## Testing After Deployment

### 1. Health endpoint

```bash
curl https://your-backend.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "env": "production",
  "uptime": 42,
  "rooms": 0,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### 2. WebSocket connection

Open your Vercel URL in a browser. Then:

- Open **DevTools** → **Network** → **WS** tab
- Reload the page
- You should see a WebSocket connection to your backend URL with `transport=websocket`
- If you only see `transport=polling`, check that your proxy/host supports WebSocket upgrades

### 3. Create and join a room

- **Tab 1**: Open the game → Create Room → note the 6-character room code
- **Tab 2** (or incognito, or a different device): Open the game → Join Room → enter the code
- Both tabs should see each other's names appear in real time

### 4. Test from a different network

Share the Vercel URL and room code with a friend on a different device/network. Confirm they can join and game state syncs.

---

## Sending the Game Link to Friends

Once deployed, send friends:

1. **The game URL** (your Vercel URL), e.g.:
   ```
   https://werewolf-game.vercel.app
   ```

2. **A room code** — create a room first, then share the 6-letter code shown in the lobby.

Friends click the URL, choose "Join Room", enter the code, pick a name, and they're in.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| CORS error in browser console | `CLIENT_ORIGIN` doesn't match Vercel URL exactly | Update env var; redeploy backend |
| Frontend shows "Connecting…" forever | Wrong `NEXT_PUBLIC_SOCKET_URL` | Check for no trailing slash; confirm backend is running |
| Socket stuck on polling | WebSocket blocked | See WebSocket note below |
| Players can't rejoin after refresh | `localStorage` blocked | Ensure not in strict private browsing mode |
| `/health` returns 502/503 | Backend not started or crashed | Check Railway/Render logs; verify start command |
| Render backend slow first connect | Free tier sleep | Upgrade to Starter, or use Railway |
| Room disappears after backend redeploy | In-memory state lost | See Known Limitation above |

### WebSocket on reverse proxies / nginx

If you're self-hosting with nginx, add these headers to your proxy config:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_read_timeout 86400;
```

---

## Security Notes

- Room state is entirely server-side — clients cannot fake game events.
- Host permission checks are enforced server-side.
- `NEXT_PUBLIC_*` variables are public and baked into the JS bundle — never put secrets there.
- Socket.IO payloads are capped at 100 KB.
- Never commit `server/.env` or `client/.env.local`.

---

## File Checklist Before Deploying

```
✅ server/.env.example exists (committed)
✅ client/.env.example exists (committed)
✅ server/.env is in .gitignore (not committed)
✅ client/.env.local is in .gitignore (not committed)
✅ server/package.json has "build": "tsc" and "start": "node dist/index.js"
✅ client/package.json has "build": "next build" and "start": "next start"
```
