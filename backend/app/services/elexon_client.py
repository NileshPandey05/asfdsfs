import logging
from typing import Any, List, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class ElexonClient:
    def __init__(self, base_url: str = settings.ELEXON_BASE_URL, timeout_seconds: float = 30.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout_seconds

    async def fetch_dataset_stream(
        self,
        dataset: str,
        publish_from: str,
        publish_to: str,
        retries: int = 3
    ) -> List[dict]:
        """
        Fetches records from Elexon stream endpoint.
        Example: /datasets/FUELHH/stream?publishDateTimeFrom=...&publishDateTimeTo=...
        """
        url = f"{self.base_url}/datasets/{dataset}/stream"
        params = {
            "publishDateTimeFrom": publish_from,
            "publishDateTimeTo": publish_to
        }
        headers = {
            "Accept": "application/json",
            "User-Agent": "WindForecastIntelligence/1.0"
        }

        for attempt in range(1, retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(url, params=params, headers=headers)
                    response.raise_for_status()
                    data = response.json()
                    if isinstance(data, list):
                        return data
                    elif isinstance(data, dict) and "data" in data:
                        return data["data"]
                    return []
            except httpx.HTTPError as exc:
                logger.warning("Elexon request attempt %d failed for %s: %s", attempt, url, exc)
                if attempt == retries:
                    logger.error("All %d attempts failed for %s", retries, url)
                    raise
        return []
