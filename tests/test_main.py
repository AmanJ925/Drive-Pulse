import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_api_root():
    response = client.get("/api")
    assert response.status_code == 200
    assert response.json() == {"service": "DrivePulse API", "version": "1.0.0", "docs": "/docs"}

def test_serve_spa():
    response = client.get("/random-non-existent-path")
    if response.status_code == 200:
        data = response.json() if "application/json" in response.headers.get("content-type", "") else None
        if data:
            assert "error" in data
    else:
        assert response.status_code == 404
