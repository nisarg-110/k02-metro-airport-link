from fastapi import APIRouter, Query
from app.data_loader import get_data
from app.models import AnomalyItem
from app.anomaly_detector import detect_all_anomalies
from typing import Optional

router = APIRouter()


@router.get("/anomalies", response_model=list[AnomalyItem])
def list_anomalies(severity: Optional[str] = Query(None, description="Filter by severity: high, medium, low")):
    ds = get_data()
    anomalies = detect_all_anomalies(ds)
    if severity:
        anomalies = [a for a in anomalies if a.severity == severity.lower()]
    return anomalies
