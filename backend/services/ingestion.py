"""
services/ingestion.py
──────────────────────
Reads all CSVs, validates, cleans, and inserts into SQLite.
Idempotent: uses INSERT OR REPLACE so re-running is safe.
"""
from __future__ import annotations
import logging, math
import pandas as pd
import numpy as np
from config import CSV
from database import executemany, query, init_db

logger = logging.getLogger(__name__)


def _clean(df: pd.DataFrame, numeric_cols: list[str] = None) -> pd.DataFrame:
    df = df.dropna(how="all").drop_duplicates(subset=[df.columns[0]])
    if numeric_cols:
        df[numeric_cols] = df[numeric_cols].apply(pd.to_numeric, errors="coerce")
        df = df.dropna(subset=numeric_cols)
    return df.reset_index(drop=True)


def _safe(v):
    """Convert numpy/pandas types to Python primitives."""
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    if isinstance(v, (np.integer,)): return int(v)
    if isinstance(v, (np.floating,)): return float(v)
    return v


def ingest_all() -> dict:
    init_db()
    report = {}

    # ── Drivers ──────────────────────────────────────────────────────────────
    df = _clean(pd.read_csv(CSV["drivers"]),
                ["avg_hours_per_day","avg_earnings_per_hour","rating"])
    # password = driver_id for prototype
    df["password"] = df["driver_id"]
    rows = [tuple(_safe(r[c]) for c in
            ["driver_id","name","city","shift_preference","avg_hours_per_day",
             "avg_earnings_per_hour","experience_months","rating","password"])
            for _, r in df.iterrows()]
    executemany("""INSERT OR REPLACE INTO drivers VALUES
        (?,?,?,?,?,?,?,?,?)""", rows)
    report["drivers"] = len(rows)

    # ── Trips ─────────────────────────────────────────────────────────────────
    df = _clean(pd.read_csv(CSV["trips"]),
                ["duration_min","distance_km","fare"])
    rows = [tuple(_safe(r[c]) for c in
            ["trip_id","driver_id","date","start_time","end_time",
             "duration_min","distance_km","fare","surge_multiplier",
             "pickup_location","dropoff_location","trip_status"])
            for _, r in df.iterrows()]
    executemany("INSERT OR REPLACE INTO trips VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", rows)
    report["trips"] = len(rows)

    # ── Accelerometer ─────────────────────────────────────────────────────────
    df = _clean(pd.read_csv(CSV["accel"]),
                ["accel_x","accel_y","accel_z","speed_kmh"])
    df["magnitude"] = np.sqrt(df["accel_x"]**2 + df["accel_y"]**2 +
                              (df["accel_z"] - 9.8)**2)
    rows = [tuple(_safe(r[c]) for c in
            ["sensor_id","trip_id","timestamp","elapsed_seconds",
             "accel_x","accel_y","accel_z","speed_kmh","gps_lat","gps_lon","magnitude"])
            for _, r in df.iterrows()]
    executemany("INSERT OR REPLACE INTO accelerometer VALUES (?,?,?,?,?,?,?,?,?,?,?)", rows)
    report["accelerometer"] = len(rows)

    # ── Audio ─────────────────────────────────────────────────────────────────
    df = _clean(pd.read_csv(CSV["audio"]), ["audio_level_db"])
    rows = [tuple(_safe(r[c]) for c in
            ["audio_id","trip_id","timestamp","elapsed_seconds",
             "audio_level_db","audio_classification","sustained_duration_sec"])
            for _, r in df.iterrows()]
    executemany("INSERT OR REPLACE INTO audio VALUES (?,?,?,?,?,?,?)", rows)
    report["audio"] = len(rows)

    # ── Driver Goals ──────────────────────────────────────────────────────────
    df = _clean(pd.read_csv(CSV["goals"]), ["target_earnings","target_hours"])
    rows = [tuple(_safe(r[c]) for c in
            ["goal_id","driver_id","date","shift_start_time","shift_end_time",
             "target_earnings","target_hours","current_earnings","current_hours",
             "status","earnings_velocity","goal_completion_forecast"])
            for _, r in df.iterrows()]
    executemany("INSERT OR REPLACE INTO driver_goals VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", rows)
    report["goals"] = len(rows)

    # ── Earnings Velocity ─────────────────────────────────────────────────────
    df = _clean(pd.read_csv(CSV["velocity"]),
                ["cumulative_earnings","elapsed_hours","current_velocity"])
    rows = [tuple(_safe(r[c]) for c in
            ["log_id","driver_id","date","timestamp","cumulative_earnings",
             "elapsed_hours","current_velocity","target_velocity",
             "velocity_delta","trips_completed","forecast_status"])
            for _, r in df.iterrows()]
    executemany("INSERT OR REPLACE INTO earnings_velocity VALUES (?,?,?,?,?,?,?,?,?,?,?)", rows)
    report["velocity"] = len(rows)

    # ── Flagged Moments ───────────────────────────────────────────────────────
    df = _clean(pd.read_csv(CSV["flagged"]))
    rows = [tuple(_safe(r[c]) for c in
            ["flag_id","trip_id","driver_id","timestamp","elapsed_seconds",
             "flag_type","severity","motion_score","audio_score",
             "combined_score","explanation","context"])
            for _, r in df.iterrows()]
    executemany("INSERT OR REPLACE INTO flagged_moments VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", rows)
    report["flagged"] = len(rows)

    # ── Trip Summaries ────────────────────────────────────────────────────────
    df = _clean(pd.read_csv(CSV["summaries"]), ["stress_score","fare"])
    rows = [tuple(_safe(r[c]) for c in
            ["trip_id","driver_id","date","duration_min","distance_km","fare",
             "earnings_velocity","motion_events_count","audio_events_count",
             "flagged_moments_count","max_severity","stress_score",
             "trip_quality_rating"])
            for _, r in df.iterrows()]
    executemany("INSERT OR REPLACE INTO trip_summaries VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", rows)
    report["summaries"] = len(rows)

    logger.info("Ingestion complete: %s", report)
    return report
