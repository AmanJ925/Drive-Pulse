from routers.api import _synthesize_accel, _synthesize_audio

def test_synthesize_accel():
    flags = [{"motion_score": 0.5, "elapsed_seconds": 30}]
    rows1 = _synthesize_accel("trip1", 60, 0.2, 1, flags)
    rows2 = _synthesize_accel("trip1", 60, 0.2, 1, flags)
    
    assert len(rows1) == 2
    assert rows1[0]["elapsed_seconds"] == 0
    assert rows1[1]["elapsed_seconds"] == 30
    assert rows1 == rows2

def test_synthesize_audio():
    flags = [{"audio_score": 0.8, "elapsed_seconds": 30}]
    rows1 = _synthesize_audio("trip1", 60, 0.2, 1, flags)
    rows2 = _synthesize_audio("trip1", 60, 0.2, 1, flags)
    
    assert len(rows1) == 2
    assert rows1[0]["elapsed_seconds"] == 0
    assert rows1[1]["elapsed_seconds"] == 30
    assert rows1 == rows2
