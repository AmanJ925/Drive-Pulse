import pytest
import pandas as pd
from pathlib import Path
from services.ingestion import ingest_all, _clean, _safe
import config
import database

def test_safe_conversion():
    assert _safe(None) is None
    import numpy as np
    assert _safe(np.nan) is None
    assert _safe(np.int64(5)) == 5
    assert _safe(np.float64(5.5)) == 5.5
    assert _safe("test") == "test"

def test_clean_dataframe():
    df = pd.DataFrame({"A": [1, 2, None], "B": ["a", "b", "c"]})
    cleaned = _clean(df, ["A"])
    assert len(cleaned) == 2
    assert cleaned["A"].tolist() == [1.0, 2.0]

def test_ingest_all(tmp_path, monkeypatch):
    db_file = tmp_path / "test.db"
    monkeypatch.setattr(database, "DB_PATH", db_file)
    
    # Create mock CSVs
    csv_paths = {}
    for key in ["drivers", "trips", "accel", "audio", "goals", "velocity", "flagged", "summaries"]:
        p = tmp_path / f"{key}.csv"
        # Minimum columns required by ingest_all for each
        if key == "drivers":
            pd.DataFrame({"driver_id": ["D1"], "avg_hours_per_day": [8], "avg_earnings_per_hour": [150], "rating": [4.5], "name": ["N"], "city": ["C"], "shift_preference": ["Day"], "experience_months": [12]}).to_csv(p, index=False)
        elif key == "trips":
            pd.DataFrame({"trip_id": ["T1"], "duration_min": [10], "distance_km": [5], "fare": [50], "driver_id":["D1"], "date":["2024-01-01"], "start_time":["10:00"], "end_time":["10:10"], "surge_multiplier":[1.0], "pickup_location":["A"], "dropoff_location":["B"], "trip_status":["completed"]}).to_csv(p, index=False)
        elif key == "accel":
            pd.DataFrame({"sensor_id": ["S1"], "accel_x": [0], "accel_y": [0], "accel_z": [9.8], "speed_kmh": [20], "trip_id":["T1"], "timestamp":["10:00"], "elapsed_seconds":[10], "gps_lat":[10.0], "gps_lon":[10.0]}).to_csv(p, index=False)
        elif key == "audio":
            pd.DataFrame({"audio_id": ["A1"], "audio_level_db": [60], "trip_id":["T1"], "timestamp":["10:00"], "elapsed_seconds":[10], "audio_classification":["normal"], "sustained_duration_sec":[0]}).to_csv(p, index=False)
        elif key == "goals":
            pd.DataFrame({"goal_id": ["G1"], "target_earnings": [1000], "target_hours": [8], "driver_id":["D1"], "date":["2024-01-01"], "shift_start_time":["10:00"], "shift_end_time":["18:00"], "current_earnings":[0], "current_hours":[0], "status":["on_track"], "earnings_velocity":[0], "goal_completion_forecast":["on_track"]}).to_csv(p, index=False)
        elif key == "velocity":
            pd.DataFrame({"log_id": ["L1"], "cumulative_earnings": [100], "elapsed_hours": [1], "current_velocity": [100], "driver_id":["D1"], "date":["2024-01-01"], "timestamp":["11:00"], "target_velocity":[150], "velocity_delta":[-50], "trips_completed":[1], "forecast_status":["behind"]}).to_csv(p, index=False)
        elif key == "flagged":
            pd.DataFrame({"flag_id": ["F1"], "trip_id":["T1"], "driver_id":["D1"], "timestamp":["10:05"], "elapsed_seconds":[300], "flag_type":["hard_brake"], "severity":["high"], "motion_score":[0.8], "audio_score":[0.1], "combined_score":[0.6], "explanation":[""], "context":[""]}).to_csv(p, index=False)
        elif key == "summaries":
            pd.DataFrame({"trip_id": ["T1"], "stress_score": [0.2], "fare": [50], "driver_id":["D1"], "date":["2024-01-01"], "duration_min":[10], "distance_km":[5], "earnings_velocity":[300], "motion_events_count":[0], "audio_events_count":[0], "flagged_moments_count":[0], "max_severity":["low"], "trip_quality_rating":["good"]}).to_csv(p, index=False)
        csv_paths[key] = p
    
    import services.ingestion
    monkeypatch.setattr(services.ingestion, "CSV", csv_paths)
    
    report = ingest_all()
    assert report["drivers"] == 1
    assert report["trips"] == 1
    assert report["accelerometer"] == 1
    assert report["audio"] == 1
    assert report["goals"] == 1
    assert report["velocity"] == 1
    assert report["flagged"] == 1
    assert report["summaries"] == 1
