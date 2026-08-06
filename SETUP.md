# AUTOGO — wiring the backend

The client is **already wired** to the API and falls back gracefully: every data
call tries `http://localhost:5000/api` first (through the Vite proxy), and only
if the API can't serve — connection refused, database down — does the bundled
demo dataset take over, with the yellow "Demo mode" banner on top. So wiring up
the backend never removes the mock data; it just stops being needed.

```
Browser ──▶ /api/* ──▶ Express (:5000) ──▶ MongoDB
   │                        │
   │  API unreachable?      │  Auth: Firebase ID token ──▶ /api/auth/sync
   ▼                        ▼
 Demo dataset          503 + clear message while Mongo is down
```

## 1. Database — MongoDB

Pick one:

- **Atlas (no install):** create a free cluster at mongodb.com/atlas, then in
  `server/.env` set
  `MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/car-rental-db`
- **Local:** install MongoDB Community Server (needs an admin terminal:
  `winget install MongoDB.Server`), keep the default
  `MONGO_URI=mongodb://localhost:27017/car-rental-db`

Then load the demo fleet into the database:

```bash
cd server
npm run seed            # idempotent — run as often as you like
npm run seed -- --fresh # wipe users/cars/reviews first
```

This inserts the same 10 cars, 5 users and 4 reviews the demo mode shows, so
the live site starts populated instead of empty. Seed users have placeholder
`firebaseUid`s — they own cars but can't sign in; real sign-ins come from
Firebase.

## 2. Auth — Firebase (both sides)

**Server** (`server/.env`) — Firebase console → Project settings → Service
accounts → *Generate new private key*:

```
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Client** (`client/.env`, copy from `client/.env.example`) — Project settings →
Your apps → Web app:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Enable **Email/Password** and **Google** under Authentication → Sign-in method.
Left blank, the client signs in against the demo accounts (password `autogo`).

## 3. Payments — Paystack

In `server/.env`, replace the `sk_test_replace_me` placeholders with your
Paystack test keys. Until then, `/api/payments/initialize` answers 503 and the
client says payments aren't configured — bookings still get created as unpaid.

## 4. Run it

```bash
cd server && npm run dev    # API on :5000
cd client && npm run dev    # site on :5173 (proxies /api to :5000)
```

The demo banner disappears on its own once `/api/cars` answers. Check
`http://localhost:5000/api/health` — it reports `database` and `auth` status.

## Going live — hosting + your own domain

Hosting and the domain are separate things: Render/Vercel run the code, the
domain is the name visitors type. Once connected, nobody ever sees
"vercel.app" or "onrender.com" — only your domain.

### 1. Buy the domain

- `autogo.ng` / `autogo.com.ng` — from a NIRA-accredited registrar
  (GO54/Whogohost, DomainKing, QServers), roughly ₦10–15k/year
- or `.com` from Namecheap / Cloudflare Registrar

### 2. Backend → Render

1. Render → **New → Blueprint** → point it at the backend repo
   (`car-rental-website-backend`) — its `render.yaml` creates the
   `autogo-api` service.
2. Fill in the `sync: false` secrets in the dashboard (Atlas URI, Firebase
   service account, Paystack, Resend, Cloudinary).
3. Custom domain: add `api.autogo.ng` in Render → it gives you a CNAME.
   At your registrar: `CNAME api → autogo-api.onrender.com`. SSL is automatic.
4. Free tier sleeps after 15 min idle (~50s cold start). The client now shows a
   "Reconnecting…" banner and auto-retries until it wakes. The $7/mo Starter
   plan removes the sleep — worth it the day you have real users.

### 3. Frontend → Vercel

1. Vercel → **Add New Project** → import this repo (`car-rental-website`) —
   it auto-detects Vite; [vercel.json](vercel.json) handles the SPA routing.
2. Environment variables: all `VITE_FIREBASE_*`, `VITE_WHATSAPP_SUPPORT`, and
   `VITE_API_URL=https://api.autogo.ng/api`.
3. Custom domain: add `autogo.ng` + `www.autogo.ng` in Vercel → Domains.
   At your registrar: `A @ → 76.76.21.21` and `CNAME www → cname.vercel-dns.com`.
   SSL is automatic.

### 4. Point everything at the domain

- Render env: `CLIENT_URL=https://autogo.ng,https://www.autogo.ng` (CORS +
  Paystack redirects)
- Firebase → Authentication → Settings → **Authorized domains**: add `autogo.ng`
- Paystack dashboard: switch to **live** keys and set the callback domain

Deploys after that are just `git push` — Render and Vercel rebuild on their own.

## Optional

- `ADMIN_SIGNUP_KEY` (server/.env): pass as `adminKey` with `role:"admin"` on
  first `/api/auth/sync` to create the admin account.
- `VITE_WHATSAPP_SUPPORT` (client/.env): customer-care number behind the
  floating WhatsApp button.
- `RESEND_API_KEY` (server/.env): real emails; without it they're logged to the
  server console instead.

## Production hardening — what's built in, what the platform does

### Security & data protection ("RLS")

Row-Level Security is a Postgres feature; this stack enforces the same
guarantee in the API layer, which is where it belongs for MongoDB:

- Every protected route: Firebase token → Mongo user → role check
  (`protect`/`authorize`), then **object-level ownership checks** — an owner
  can only touch *their* car/booking, a customer only *their* booking.
- Mongo operator injection is refused globally (`sanitizeFilter`), request
  bodies are capped at 1 MB, `helmet` sets the security headers, CORS is
  locked to `CLIENT_URL` in production, and stack traces never leave the
  server outside development.
- Secrets live only in env vars; card details never touch the server at all
  (Paystack hosted checkout). Firewalling the database: in Atlas, restrict
  Network Access to Render's outbound IPs instead of 0.0.0.0/0.

### Rate limiting

Per-IP, sliding 15-minute windows, HTTP 429 with standard RateLimit headers:
300 requests on `/api/*`, 30 on `/api/auth/*` and `/api/payments/*`.
`trust proxy` is set so limits track real visitor IPs behind Render. The
store is in-memory — when you scale past one instance, move it to Redis.

### Caching & CDN

- Frontend: Vercel's CDN serves the static build worldwide; hashed assets
  ship with `immutable` cache headers (vercel.json).
- API: public catalogue reads (`GET /api/cars*`, reviews) send
  `Cache-Control: public, max-age=30, stale-while-revalidate=120` — burst
  protection without stale availability. Authed routes are never cached.
- Optional Cloudflare: move the domain's nameservers to Cloudflare (free),
  proxy `www`/apex and `api` — you get a global CDN in front of both hosts,
  DDoS protection and their WAF. The API cache headers above mean Cloudflare
  automatically absorbs catalogue traffic.

### Load balancing & scaling

The API is stateless by design — auth is a Firebase token per request, no
server-side sessions — so it scales horizontally with zero code changes:
Render Starter → increase instance count, Render balances traffic itself.
The database scales separately on Atlas (M0 → M10 is a slider, plus its own
connection pooling). The two things to revisit past one instance: the rate
limiter store (Redis) and log aggregation.

### Error tracking & logs

- Every API failure logs one structured JSON line (time, level, status,
  method, path, ip, user, message; stacks on 5xx) — searchable directly in
  Render → Logs, and ingestible by any collector (Logtail, Datadog).
- Unhandled rejections are logged; uncaught exceptions log then exit so the
  platform restarts a clean process. `/api/health` reports database + auth
  state and is Render's health check, so a dead process is replaced.
- When you want alerting + client-side crash reports, add Sentry: free tier,
  `@sentry/node` on the API and `@sentry/react` in the client, initialised
  only when `SENTRY_DSN` is set.