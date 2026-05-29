import sys
from pathlib import Path

# Add backend directory to sys.path so modules like `auth` can be imported directly
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_dir))
