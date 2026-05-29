import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_ws_endpoint():
    with client.websocket_connect("/stream_sensor_data") as websocket:
        websocket.send_json({"type": "ping"})
        data = websocket.receive_json()
        assert data["type"] == "pong"
        assert "ts" in data

def test_ws_sensor():
    with client.websocket_connect("/stream_sensor_data") as websocket:
        # start trip
        websocket.send_json({"type": "trip_start"})
        ack = websocket.receive_json()
        assert ack["type"] == "ack"
        
        # send sensor data
        websocket.send_json({
            "type": "sensor",
            "payload": {"ax": 1, "ay": 1, "az": 9.8, "audio_intensity": 90, "driver_id": "D1"}
        })
        alert = websocket.receive_json()
        assert alert["type"] == "alert"
        assert alert["severity"] in ["high", "medium", "low"]
