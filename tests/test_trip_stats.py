from routers.api import _compute_trip_stats, _correct_flags

def test_compute_trip_stats_empty():
    stats = _compute_trip_stats([])
    assert stats["stress_score"] == 0.0
    assert stats["safety_score"] == 100
    assert stats["trip_quality_rating"] == "excellent"

def test_compute_trip_stats_with_flags():
    flags = [
        {"motion_score": 0.6, "audio_score": 0.6, "combined_score": 0.6},
        {"motion_score": 0.5, "audio_score": 0.1, "combined_score": 0.4},
        {"motion_score": 0.1, "audio_score": 0.1, "combined_score": 0.1, "flag_type": "conflict_moment"}
    ]
    
    stats = _compute_trip_stats(flags)
    assert stats["stress_score"] > 0.60
    assert stats["trip_quality_rating"] == "poor"

def test_correct_flags():
    flags = [{"motion_score": 0.6, "audio_score": 0.6, "combined_score": 0.6, "other_field": "test"}]
    corrected = _correct_flags(flags)
    assert len(corrected) == 1
    assert corrected[0]["severity"] == "high"
    assert corrected[0]["other_field"] == "test"
