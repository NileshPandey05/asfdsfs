import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"

class Settings(BaseModel):
    PROJECT_NAME: str = "Wind Forecast Intelligence"
    API_V1_STR: str = "/api"
    ELEXON_BASE_URL: str = os.getenv("ELEXON_BASE_URL", "https://data.elexon.co.uk/bmrs/api/v1")
    SNAPSHOT_FILE: Path = Path(os.getenv("SNAPSHOT_FILE", str(DATA_DIR / "january_2026_snapshot.json")))
    DEFAULT_CUTOFF_HOUR: int = int(os.getenv("DEFAULT_CUTOFF_HOUR", "11"))
    DEFAULT_CUTOFF_MINUTE: int = int(os.getenv("DEFAULT_CUTOFF_MINUTE", "0"))
    DEFAULT_MONTH: str = "2026-01"
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

settings = Settings()
