"""
routers/ws.py — WebSocket live telemetry endpoint.

Protocol (client → server):
  { "type": "ping" }
  { "type": "sensor", "payload": { driver_id, trip_id, ax, ay, az, audio_intensity, timestamp } }

Protocol (server → client):
  { "type": "pong" }
  { "type": "alert", "severity": "high|medium|low", "message": "...", "payload": {...} }
  { "type": "ack", "received": true }
  { "type": "network_gap" }     — injected when > 6 s of silence
"""
from __future__ import annotations
import asyncio, json, logging, math, time
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# Track last-packet time per driver for gap detection
_last_packet: dict[str, float] = {}


def _magnitude(ax: float, ay: float, az: float) -> float:
    return math.sqrt(ax**2 + ay**2 + (az - 9.8)**2)


def _evaluate(ax: float, ay: float, az: float,
              audio_db: float) -> list[dict] | None:
    mag = _magnitude(ax, ay, az)
    alerts = []

    if mag > 2.5:                                      # device drop
        return None
    if mag > 0.5 and audio_db > 80:
        alerts.append({
            "severity": "high",
            "message": "⚠ Hard braking combined with elevated cabin noise — potential conflict",
            "payload": {"mag": round(mag, 2), "audio_db": round(audio_db, 1)},
        })
    elif mag > 0.5:
        alerts.append({
            "severity": "medium",
            "message": "⚠ Hard braking detected",
            "payload": {"mag": round(mag, 2)},
        })
    elif audio_db > 80:
        alerts.append({
            "severity": "low",
            "message": "⚠ Loud cabin noise detected",
            "payload": {"audio_db": round(audio_db, 1)},
        })

    return alerts if alerts else None


@router.websocket("/stream_sensor_data")
async def sensor_stream(ws: WebSocket):
    await ws.accept()
    driver_id: str | None = None
    in_trip: bool = False

    # Background gap-detection task
    async def gap_monitor():
        while True:
            await asyncio.sleep(6)
            if driver_id and driver_id in _last_packet:
                gap = time.time() - _last_packet[driver_id]
                if gap > 6:
                    try:
                        await ws.send_json({
                            "type": "network_gap",
                            "gap_seconds": round(gap, 1),
                            "message": "No sensor data — network gap detected",
                        })
                    except Exception:
                        return

    gap_task = asyncio.create_task(gap_monitor())

    try:
        while True:
            raw = await asyncio.wait_for(ws.receive_text(), timeout=60.0)
            msg = json.loads(raw)
            kind = msg.get("type", "")

            if kind == "ping":
                await ws.send_json({"type": "pong",
                                    "ts": datetime.now(timezone.utc).isoformat()})

            elif kind == "auth":
                token = msg.get("token", "")
                user  = get_current_user(token)
                if user:
                    driver_id = user["sub"]
                    await ws.send_json({"type": "auth_ok", "driver_id": driver_id})
                else:
                    await ws.send_json({"type": "auth_fail"})

            elif kind == "trip_start":
                in_trip = True
                await ws.send_json({"type": "ack", "event": "trip_started"})

            elif kind == "trip_end":
                in_trip = False
                await ws.send_json({"type": "ack", "event": "trip_ended"})

            elif kind == "sensor" and in_trip:
                pl = msg.get("payload", {})
                ax  = float(pl.get("ax", 0))
                ay  = float(pl.get("ay", 0))
                az  = float(pl.get("az", 9.8))
                db  = float(pl.get("audio_intensity", 0))
                did = str(pl.get("driver_id", driver_id or ""))

                if did:
                    _last_packet[did] = time.time()

                alerts = _evaluate(ax, ay, az, db)
                if alerts:
                    for alert in alerts:
                        await ws.send_json({"type": "alert", **alert})
                else:
                    await ws.send_json({"type": "ack", "received": True})

    except (WebSocketDisconnect, asyncio.TimeoutError):
        pass
    except Exception as exc:
        logger.error("WS error: %s", exc)
    finally:
        gap_task.cancel()
        if driver_id:
            _last_packet.pop(driver_id, None)
