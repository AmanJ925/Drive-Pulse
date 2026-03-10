# DrivePulse v5

Driver Safety & Earnings Insights — Uber Hackathon

## Stack

| Layer    | Tech                                    |
|----------|-----------------------------------------|
| Backend  | Python · FastAPI · SQLite               |
| Frontend | React 18 · TypeScript · Vite · Chart.js |

## Quick Start

### Production (build frontend → serve via FastAPI)
```bash
cd dp_v5
pip install -r requirements.txt
cd backend
python main.py

cd dp_v5/frontend
npm install
npm run dev
# Backend  → http://localhost:8000
# Frontend → http://localhost:5173  (Vite dev server, proxies /api)
```

## Project Structure

```
dp_v5/
├── backend/
│   ├── data/           # CSV source data
│   ├── routers/
│   │   ├── api.py      # REST endpoints
│   │   └── ws.py       # WebSocket live telemetry
│   ├── services/
│   │   └── ingestion.py
│   ├── auth.py
│   ├── config.py
│   ├── database.py
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Nav.tsx
│   │   │   └── shared.tsx   # Charts, badges, icons
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── TripPage.tsx
│   │   │   ├── EarningsPage.tsx
│   │   │   ├── AdminOverviewPage.tsx
│   │   │   └── AdminDriverPage.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── requirements.txt
├── run.sh          # build + run
├── dev.sh          # hot-reload dev mode
└── .gitignore      # excludes __pycache__, *.pyc, node_modules, etc.
```

## Demo Credentials

| Role   | ID / Password           |
|--------|-------------------------|
| Driver | DRV001–DRV010, password = ID |
| Admin  | password = `admin123`   |

## Key Bug Fixes (from v4)

1. **Earnings card** — now sums actual trip fares (not stale CSV `goal.current_earnings`)
2. **Flags card** — now counts from `flagged_moments` table (not stale CSV `trip_summaries`)
3. **No `.pyc` files** — excluded via `.gitignore`; Python compiles them only at runtime
