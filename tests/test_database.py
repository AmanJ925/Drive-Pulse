import pytest
from pathlib import Path
import sqlite3
import database

def test_database_operations(tmp_path, monkeypatch):
    db_file = tmp_path / "test.db"
    monkeypatch.setattr(database, "DB_PATH", db_file)

    # test init
    database.init_db()
    assert db_file.exists()

    # test execute and query
    database.execute("INSERT INTO drivers (driver_id, name) VALUES (?, ?)", ("D1", "Test Driver"))
    result = database.query("SELECT * FROM drivers WHERE driver_id=?", ("D1",))
    assert len(result) == 1
    assert result[0]["name"] == "Test Driver"

    # test executemany
    database.executemany("INSERT INTO drivers (driver_id, name) VALUES (?, ?)", [("D2", "A"), ("D3", "B")])
    result = database.query("SELECT * FROM drivers")
    assert len(result) == 3
