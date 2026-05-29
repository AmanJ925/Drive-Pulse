import pytest
from fastapi.testclient import TestClient
from main import app
from unittest.mock import patch
import auth

client = TestClient(app)

def test_login_api(monkeypatch):
    def mock_query(sql, params=()):
        if params == ("D1",):
            return [{"driver_id": "D1", "password": "D1"}]
        return []
    
    monkeypatch.setattr(auth, "query", mock_query)
    
    response = client.post("/api/login", json={"driver_id": "D1", "password": "D1", "is_admin": False})
    assert response.status_code == 200
    assert "token" in response.json()
    
    response = client.post("/api/login", json={"driver_id": "D2", "password": "wrong", "is_admin": False})
    assert response.status_code == 401

def test_get_dashboard(monkeypatch):
    def mock_query(sql, params=()):
        if "driver_goals" in sql:
            return [{"target_earnings": 1000, "current_velocity": 150}]
        if "trips" in sql:
            return [{"trip_id": "T1", "fare": 100}]
        if "flagged_moments" in sql:
            return [{"flag_id": "F1", "severity": "high"}]
        if "earnings_velocity" in sql:
            return []
        return []
        
    import routers.api
    monkeypatch.setattr(routers.api, "query", mock_query)
    
    admin_token = auth.login_admin("admin123")["token"]
    response = client.get("/api/dashboard/D1", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.json()
    assert "goal" in data
    assert data["today_earnings"] == 100
    assert data["flagged_events"] == 1

def test_get_drivers(monkeypatch):
    def mock_query(sql, params=()):
        if "drivers" in sql:
            return [{"driver_id": "D1", "name": "Driver 1"}]
        if "driver_goals" in sql:
            return [{"driver_id": "D1", "current_velocity": 100, "target_velocity": 150}]
        return []
    
    import routers.api
    monkeypatch.setattr(routers.api, "query", mock_query)
    
    admin_token = auth.login_admin("admin123")["token"]
    response = client.get("/api/drivers", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Driver 1"

def test_get_driver_details(monkeypatch):
    def mock_query(sql, params=()):
        if "drivers" in sql:
            return [{"driver_id": "D1", "name": "Driver 1"}]
        if "trip_summaries" in sql:
            return [{"trip_id": "T1", "fare": 100}]
        if "earnings_velocity" in sql:
            return [{"cumulative_earnings": 100}]
        return []
    
    import routers.api
    monkeypatch.setattr(routers.api, "query", mock_query)
    
    admin_token = auth.login_admin("admin123")["token"]
    response = client.get("/api/drivers/D1", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Driver 1"

def test_get_trip_details(monkeypatch):
    def mock_query(sql, params=()):
        if "trip_summaries" in sql:
            return [{"trip_id": "T1", "fare": 100}]
        if "accelerometer" in sql:
            return [{"elapsed_seconds": 10, "magnitude": 1.5}]
        if "audio" in sql:
            return [{"elapsed_seconds": 10, "audio_level_db": 80}]
        if "flagged_moments" in sql:
            return [{"flag_id": "F1", "severity": "high"}]
        return []
    
    import routers.api
    monkeypatch.setattr(routers.api, "query", mock_query)
    
    admin_token = auth.login_admin("admin123")["token"]
    response = client.get("/api/trips/T1", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["fare"] == 100
    assert len(data["accelerometer"]) == 1
