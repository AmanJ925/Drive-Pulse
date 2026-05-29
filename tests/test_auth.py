import pytest
import auth

def test_login_admin():
    assert auth.login_admin("wrong") is None
    admin = auth.login_admin("admin123")
    assert admin is not None
    assert admin["token"] is not None

def test_get_current_user():
    admin = auth.login_admin("admin123")
    assert admin is not None
    token = admin["token"]
    
    user = auth.get_current_user(token)
    assert user is not None
    assert user["role"] == "admin"
    
    assert auth.get_current_user("invalid_token") is None

def test_login_driver(monkeypatch):
    def mock_query(sql, params=()):
        if params == ("D1",):
            return [{"driver_id": "D1", "password": "D1"}]
        return []
    
    monkeypatch.setattr(auth, "query", mock_query)
    
    assert auth.login_driver("D1", "D1") is not None
    assert auth.login_driver("D1", "wrong") is None
