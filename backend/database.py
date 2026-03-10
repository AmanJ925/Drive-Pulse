"""
database.py — SQLite persistence layer using the stdlib sqlite3 module.
No ORM dependency — keeps setup to zero extra packages.
Tables mirror the CSV schemas exactly so ingestion is a simple INSERT.
"""
from __future__ import annotations
import sqlite3, logging, json
from pathlib import Path
from config import DB_PATH

logger = logging.getLogger(__name__)

DDL = """
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS drivers (
    driver_id TEXT PRIMARY KEY,
    name TEXT, city TEXT, shift_preference TEXT,
    avg_hours_per_day REAL, avg_earnings_per_hour REAL,
    experience_months INTEGER, rating REAL,
    password TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS trips (
    trip_id TEXT PRIMARY KEY,
    driver_id TEXT, date TEXT, start_time TEXT, end_time TEXT,
    duration_min REAL, distance_km REAL, fare REAL,
    surge_multiplier REAL, pickup_location TEXT,
    dropoff_location TEXT, trip_status TEXT,
    FOREIGN KEY(driver_id) REFERENCES drivers(driver_id)
);

CREATE TABLE IF NOT EXISTS accelerometer (
    sensor_id TEXT PRIMARY KEY,
    trip_id TEXT, timestamp TEXT, elapsed_seconds INTEGER,
    accel_x REAL, accel_y REAL, accel_z REAL,
    speed_kmh REAL, gps_lat REAL, gps_lon REAL, magnitude REAL
);

CREATE TABLE IF NOT EXISTS audio (
    audio_id TEXT PRIMARY KEY,
    trip_id TEXT, timestamp TEXT, elapsed_seconds INTEGER,
    audio_level_db REAL, audio_classification TEXT,
    sustained_duration_sec INTEGER
);

CREATE TABLE IF NOT EXISTS driver_goals (
    goal_id TEXT PRIMARY KEY,
    driver_id TEXT, date TEXT,
    shift_start_time TEXT, shift_end_time TEXT,
    target_earnings REAL, target_hours REAL,
    current_earnings REAL, current_hours REAL,
    status TEXT, earnings_velocity REAL,
    goal_completion_forecast TEXT
);

CREATE TABLE IF NOT EXISTS earnings_velocity (
    log_id TEXT PRIMARY KEY,
    driver_id TEXT, date TEXT, timestamp TEXT,
    cumulative_earnings REAL, elapsed_hours REAL,
    current_velocity REAL, target_velocity REAL,
    velocity_delta REAL, trips_completed INTEGER,
    forecast_status TEXT
);

CREATE TABLE IF NOT EXISTS flagged_moments (
    flag_id TEXT PRIMARY KEY,
    trip_id TEXT, driver_id TEXT, timestamp TEXT,
    elapsed_seconds INTEGER, flag_type TEXT, severity TEXT,
    motion_score REAL, audio_score REAL, combined_score REAL,
    explanation TEXT, context TEXT
);

CREATE TABLE IF NOT EXISTS trip_summaries (
    trip_id TEXT PRIMARY KEY,
    driver_id TEXT, date TEXT, duration_min REAL,
    distance_km REAL, fare REAL, earnings_velocity REAL,
    motion_events_count INTEGER, audio_events_count INTEGER,
    flagged_moments_count INTEGER, max_severity TEXT,
    stress_score REAL, trip_quality_rating TEXT
);
"""


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db() -> None:
    conn = get_conn()
    conn.executescript(DDL)
    conn.commit()
    conn.close()
    logger.info("DB initialised at %s", DB_PATH)


def rows_to_dicts(rows) -> list[dict]:
    return [dict(r) for r in rows]


def query(sql: str, params=()) -> list[dict]:
    conn = get_conn()
    cur = conn.execute(sql, params)
    result = rows_to_dicts(cur.fetchall())
    conn.close()
    return result


def execute(sql: str, params=()) -> None:
    conn = get_conn()
    conn.execute(sql, params)
    conn.commit()
    conn.close()


def executemany(sql: str, param_list) -> None:
    conn = get_conn()
    conn.executemany(sql, param_list)
    conn.commit()
    conn.close()
