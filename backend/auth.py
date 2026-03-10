"""auth.py — Simple HMAC token auth for prototype."""
from __future__ import annotations
import hashlib, hmac, time, json, base64
from config import SECRET_KEY
from database import query


def _sign(payload: dict) -> str:
    data = base64.b64encode(json.dumps(payload).encode()).decode()
    sig  = hmac.new(SECRET_KEY.encode(), data.encode(), hashlib.sha256).hexdigest()
    return f"{data}.{sig}"


def _verify(token: str) -> dict | None:
    try:
        data, sig = token.rsplit(".", 1)
        expected = hmac.new(SECRET_KEY.encode(), data.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(base64.b64decode(data))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


def login_driver(driver_id: str, password: str) -> dict | None:
    rows = query("SELECT * FROM drivers WHERE driver_id=?", (driver_id,))
    if not rows:
        return None
    driver = rows[0]
    # prototype: password == driver_id
    if password != driver_id and password != driver.get("password",""):
        return None
    token = _sign({"sub": driver_id, "role": "driver",
                   "exp": time.time() + 86400})
    return {"token": token, "driver": driver}


def login_admin(password: str) -> dict | None:
    from config import ADMIN_PASSWORD
    if password != ADMIN_PASSWORD:
        return None
    token = _sign({"sub": "admin", "role": "admin",
                   "exp": time.time() + 86400})
    return {"token": token}


def get_current_user(token: str) -> dict | None:
    return _verify(token)
