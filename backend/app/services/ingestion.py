import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional
from dateutil import parser
from app.core.config import settings
from app.schemas.wind import WindActual, WindForecast
from app.services.elexon_client import ElexonClient

logger = logging.getLogger(__name__)

def parse_utc_datetime(val: Any) -> datetime:
    if isinstance(val, datetime):
        if val.tzinfo is None:
            return val.replace(tzinfo=timezone.utc)
        return val.astimezone(timezone.utc)
    if isinstance(val, str):
        # Handle trailing Z or timezone offsets
        dt = parser.isoparse(val)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    raise ValueError(f"Cannot parse datetime from: {val}")

class IngestionService:
    def __init__(self, snapshot_path: Optional[Path] = None, client: Optional[ElexonClient] = None):
        self.snapshot_path = snapshot_path or settings.SNAPSHOT_FILE
        self.client = client or ElexonClient()
        self._cached_actuals: Optional[List[WindActual]] = None
        self._cached_forecasts: Optional[List[WindForecast]] = None
        self._cached_metadata: Optional[Dict[str, Any]] = None

    def load_from_snapshot(self) -> Tuple[List[WindActual], List[WindForecast], Dict[str, Any]]:
        """Loads and normalises dataset from local verified snapshot."""
        if not self.snapshot_path.exists():
            raise FileNotFoundError(f"Snapshot file not found: {self.snapshot_path}")

        with open(self.snapshot_path, "r", encoding="utf-8") as f:
            raw = json.load(f)

        raw_actuals = raw.get("actuals", [])
        raw_forecasts = raw.get("forecasts", [])
        metadata = raw.get("metadata", {})
        metadata["mode"] = "cached_snapshot"

        actuals = self.normalize_actuals(raw_actuals)
        forecasts = self.normalize_forecasts(raw_forecasts)

        self._cached_actuals = actuals
        self._cached_forecasts = forecasts
        self._cached_metadata = metadata

        logger.info(
            "Loaded %d actuals and %d forecasts from snapshot: %s",
            len(actuals), len(forecasts), self.snapshot_path
        )
        return actuals, forecasts, metadata

    async def load_live_or_snapshot(
        self,
        force_live: bool = False,
        month: str = "2026-01"
    ) -> Tuple[List[WindActual], List[WindForecast], Dict[str, Any]]:
        """
        Loads data either from the local snapshot or directly from live Elexon API.
        """
        if not force_live and self.snapshot_path.exists():
            if self._cached_actuals is not None and self._cached_forecasts is not None:
                return self._cached_actuals, self._cached_forecasts, self._cached_metadata
            return self.load_from_snapshot()

        # Otherwise fetch live
        try:
            logger.info("Attempting live Elexon ingestion for month %s", month)
            # Delivery window: 2026-01-01 to 2026-02-02
            f_stream = await self.client.fetch_dataset_stream(
                "FUELHH", f"{month}-01T00:00:00Z", "2026-02-02T00:00:00Z"
            )
            # Forecasts window: 2025-12-31 to 2026-02-01
            w_stream = await self.client.fetch_dataset_stream(
                "WINDFOR", "2025-12-31T00:00:00Z", "2026-02-01T23:59:59Z"
            )

            actuals = self.normalize_actuals(f_stream)
            forecasts = self.normalize_forecasts(w_stream)
            metadata = {
                "source": "Live Elexon Insights Solution REST API",
                "retrieved_at": datetime.now(timezone.utc).isoformat(),
                "mode": "live_api",
                "actuals_count": len(actuals),
                "forecasts_count": len(forecasts)
            }
            self._cached_actuals = actuals
            self._cached_forecasts = forecasts
            self._cached_metadata = metadata
            return actuals, forecasts, metadata
        except Exception as exc:
            logger.warning("Live ingestion failed (%s), falling back to snapshot", exc)
            if self.snapshot_path.exists():
                return self.load_from_snapshot()
            raise

    def normalize_actuals(self, raw_items: List[dict]) -> List[WindActual]:
        """Normalises and filters actual records strictly to fuelType == WIND."""
        valid: List[WindActual] = []
        for r in raw_items:
            # Check fuelType
            if r.get("fuelType") != "WIND":
                continue
            gen = r.get("generation")
            if gen is None:
                # Never fill missing with zero
                continue
            try:
                st = parse_utc_datetime(r["startTime"])
                pt = parse_utc_datetime(r["publishTime"]) if r.get("publishTime") else None
                valid.append(
                    WindActual(
                        start_time=st,
                        publish_time=pt,
                        settlement_date=r.get("settlementDate"),
                        settlement_period=r.get("settlementPeriod"),
                        fuel_type="WIND",
                        generation_mw=float(gen)
                    )
                )
            except Exception as e:
                logger.debug("Skipping malformed actual record: %s (%s)", r, e)
        # Deduplicate on start_time keeping latest
        dedup: Dict[datetime, WindActual] = {}
        for a in valid:
            dedup[a.start_time] = a
        return sorted(dedup.values(), key=lambda a: a.start_time)

    def normalize_forecasts(self, raw_items: List[dict]) -> List[WindForecast]:
        """Normalises forecast vintages preserving (startTime, publishTime) multiplicity."""
        valid: List[WindForecast] = []
        for r in raw_items:
            gen = r.get("generation")
            if gen is None:
                continue
            try:
                st = parse_utc_datetime(r["startTime"])
                pt = parse_utc_datetime(r["publishTime"])
                valid.append(
                    WindForecast(
                        start_time=st,
                        publish_time=pt,
                        generation_mw=float(gen)
                    )
                )
            except Exception as e:
                logger.debug("Skipping malformed forecast record: %s (%s)", r, e)
        
        # Deduplicate exact (start_time, publish_time) duplicates if any
        dedup: Dict[Tuple[datetime, datetime], WindForecast] = {}
        for f in valid:
            dedup[(f.start_time, f.publish_time)] = f
        return sorted(dedup.values(), key=lambda f: (f.start_time, f.publish_time))
