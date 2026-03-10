"""config.py — DrivePulse central configuration."""
from pathlib import Path

BASE_DIR = Path(__file__).parent
DATA_DIR  = BASE_DIR / "data"
DB_PATH   = BASE_DIR / "drivepulse.db"

# Auth
SECRET_KEY = "drivepulse-hackathon-secret-2024"
ADMIN_PASSWORD = "admin123"

# Sensor thresholds
ACCEL_HARSH_BRAKE   = 0.5
ACCEL_HARSH_ACCEL   = 0.6
ACCEL_SHARP_TURN    = 0.45
ACCEL_DROP          = 2.5
AUDIO_HIGH_DB       = 80
AUDIO_ELEVATED_DB   = 70
AUDIO_SUSTAINED_SEC = 30

# Stress scoring weights
W_MOTION    = 0.45
W_AUDIO     = 0.45
W_FREQ      = 0.10

# Earnings
TARGET_VELOCITY_INR = 175.0   # ₹/hr baseline

CSV = {
    "drivers":    DATA_DIR / "drivers.csv",
    "trips":      DATA_DIR / "trips.csv",
    "accel":      DATA_DIR / "accelerometer_data.csv",
    "audio":      DATA_DIR / "audio_intensity_data.csv",
    "goals":      DATA_DIR / "driver_goals.csv",
    "velocity":   DATA_DIR / "earnings_velocity_log.csv",
    "flagged":    DATA_DIR / "flagged_moments.csv",
    "summaries":  DATA_DIR / "trip_summaries.csv",
}
