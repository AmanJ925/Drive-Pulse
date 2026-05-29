from routers.api import _correct_severity

def test_correct_severity():
    # "high" when motion and audio are both at least 0.6
    assert _correct_severity(0.6, 0.6, 0.0) == "high"
    
    # "high" when combined score is at least 0.75
    assert _correct_severity(0.0, 0.0, 0.75) == "high"
    
    # "medium" when motion alone is at least 0.5
    assert _correct_severity(0.5, 0.0, 0.0) == "medium"
    
    # "medium" when audio alone is at least 0.7
    assert _correct_severity(0.0, 0.7, 0.0) == "medium"
    
    # "low" for low scores
    assert _correct_severity(0.1, 0.1, 0.1) == "low"
