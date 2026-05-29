# DrivePulse

DrivePulse is a standalone driver safety and earnings analytics project. It provides deep insights into driver behavior, safety, and financial performance by analyzing telemetry data and earnings velocity.

## Features

- **Safety Scoring:** Evaluates driving patterns using synthesized sensor data to produce real-time safety scores.
- **Earnings Velocity:** Tracks current earnings against shift targets and forecasts goal completion.
- **Trip Analytics:** Provides detailed trip-level insights including flagged moments and quality ratings.

## Tech Stack

| Layer    | Tech                                    |
|----------|-----------------------------------------|
| Backend  | Python · FastAPI · SQLite               |
| Frontend | React 18 · TypeScript · Vite · Chart.js |

## Project Structure

```
Drive-Pulse/
├── backend/
│   ├── data/           # CSV source data
│   ├── routers/        # REST endpoints and WebSockets
│   ├── services/       # Data ingestion services
│   ├── auth.py
│   ├── config.py
│   ├── database.py
│   └── main.py
├── frontend/           # React frontend application
├── tests/              # Backend regression tests
├── requirements.txt    # Python dependencies
├── Dockerfile          # Container build instructions
└── .dockerignore
```

## Quick Start (Local Setup)

### Prerequisites

- Python 3.11+
- Node.js & npm

### Backend

```bash
pip install -r requirements.txt
cd backend
python main.py
# Backend API available at http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Frontend available at http://localhost:5173
```

## Docker

You can build and run the entire application using Docker:

```bash
# Build the image
docker build -t drive-pulse-silver .

# Run the container
docker run -p 8000:8000 drive-pulse-silver
```

## Testing

Backend behaviors are verified using `pytest`.

```bash
# Run tests and show coverage report
python -m pytest tests --cov=backend --cov-report=term-missing
```

## Demo Credentials

Use these credentials to explore the local seeded data:

| Role   | ID / Password           |
|--------|-------------------------|
| Driver | DRV001–DRV010, password = ID |
| Admin  | password = `admin123`   |
