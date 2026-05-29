import pytest
from fastapi.testclient import TestClient
import main
from main import app

client = TestClient(app)

def test_api_root():
    response = client.get("/api")
    assert response.status_code == 200
    assert response.json() == {"service": "DrivePulse API", "version": "1.0.0", "docs": "/docs"}

def test_serve_spa(tmp_path, monkeypatch):
    frontend_dir = tmp_path / "static"
    frontend_dir.mkdir()
    index_file = frontend_dir / "index.html"
    index_file.write_text("<html>Mock SPA</html>")
    
    monkeypatch.setattr(main, "frontend_dir", frontend_dir)
    
    response = client.get("/some-client-route")
    assert response.status_code == 200
    assert "Mock SPA" in response.text
