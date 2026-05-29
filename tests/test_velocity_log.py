from routers.api import _synthesize_velocity_log

def test_synthesize_velocity_log_empty():
    assert _synthesize_velocity_log("D1", {}, []) == []
    assert _synthesize_velocity_log("D1", {"target_earnings": 100}, []) == []

def test_synthesize_velocity_log():
    goal = {"target_earnings": 100, "target_hours": 2, "date": "2024-01-01"}
    trips = [
        {"start_time": "10:00", "fare": 40, "duration_min": 30},
        {"start_time": "11:00", "fare": 60, "duration_min": 30}
    ]
    log = _synthesize_velocity_log("D1", goal, trips)
    
    assert len(log) == 2
    assert log[0]["cumulative_earnings"] == 40
    assert log[0]["trips_completed"] == 1
    assert log[1]["cumulative_earnings"] == 100
    assert log[1]["trips_completed"] == 2
