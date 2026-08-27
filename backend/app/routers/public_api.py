"""
GRAM-X Public Trust, Transparency & Citizen Accountability Router (Phase 55)
Provides unauthenticated, public-safe endpoints with strict PII filtering,
zero enumeration leakage, noindex tags, and cache protections:
- GET  /api/public/track/{public_reference}
- GET  /api/public/receipt/{public_reference}
- GET  /api/public/qr/{public_reference}
- POST /api/public/feedback/{public_reference}
- GET  /api/public/metrics
- GET  /api/public/digital-twin
"""

import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import Response as RawResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.public_trust_service import public_trust_service

logger = logging.getLogger("gramx.public_api")
public_router = APIRouter(prefix="/public", tags=["Public Trust & Transparency"])

class PublicFeedbackRequest(BaseModel):
    is_resolved: bool = Field(..., description="Was your grievance satisfactorily resolved?")
    rating: Optional[int] = Field(None, ge=1, le=5, description="1 to 5 rating")
    comment: Optional[str] = Field(None, max_length=500, description="Optional citizen comment")


@public_router.get("/track/{public_reference}")
def get_public_complaint_tracking(
    public_reference: str,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Public-Safe Complaint Tracking:
    Returns sanitized lifecycle timeline, SLA state, and verified Before/After evidence.
    Enforces no-store caching and noindex robot directives.
    """
    response.headers["Cache-Control"] = "no-store, private"
    response.headers["X-Robots-Tag"] = "noindex, nofollow"

    data = public_trust_service.get_public_complaint_status(db, public_reference)
    if not data:
        raise HTTPException(status_code=404, detail="Complaint reference not found.")

    return data


@public_router.get("/receipt/{public_reference}")
def get_public_resolution_receipt(
    public_reference: str,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Public Resolution Receipt:
    Generates an official verifiable receipt verifying grievance resolution and administrative audit.
    """
    response.headers["Cache-Control"] = "no-store, private"
    response.headers["X-Robots-Tag"] = "noindex, nofollow"

    receipt = public_trust_service.generate_resolution_receipt_payload(db, public_reference)
    if not receipt:
        raise HTTPException(status_code=404, detail="Complaint reference not found.")

    return receipt


@public_router.get("/qr/{public_reference}")
def get_public_tracking_qr(
    public_reference: str,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Public QR Code Vector Image:
    Returns pure SVG vector QR code pointing to public tracking interface.
    """
    incident = public_trust_service.find_incident_by_reference(db, public_reference)
    if not incident:
        raise HTTPException(status_code=404, detail="Complaint reference not found.")

    pref = public_trust_service.format_public_reference(incident)
    tracking_url = f"https://gramx.gov.in/track/{pref}"
    svg = public_trust_service.generate_qr_svg(tracking_url)

    return RawResponse(
        content=svg,
        media_type="image/svg+xml",
        headers={
            "Cache-Control": "public, max-age=3600",
            "X-Robots-Tag": "noindex, nofollow"
        }
    )


@public_router.post("/feedback/{public_reference}")
def submit_public_citizen_feedback(
    public_reference: str,
    req: PublicFeedbackRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Public Citizen Feedback & Reopen Loop:
    Enables citizens to rate resolution and request review if unsatisfied.
    """
    response.headers["Cache-Control"] = "no-store, private"
    response.headers["X-Robots-Tag"] = "noindex, nofollow"

    try:
        res = public_trust_service.submit_public_feedback(
            db=db,
            public_reference=public_reference,
            is_resolved=req.is_resolved,
            rating=req.rating,
            comment=req.comment
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@public_router.get("/metrics")
def get_public_service_metrics(
    village_id: Optional[int] = Query(None),
    response: Response = None,
    db: Session = Depends(get_db)
):
    """
    Public Aggregated Service Delivery Metrics:
    Exposes transparent district and panchayat level resolution and SLA metrics (Zero PII).
    """
    if response:
        response.headers["Cache-Control"] = "public, max-age=60"

    return public_trust_service.get_public_aggregate_metrics(db, village_id=village_id)


@public_router.get("/digital-twin")
def get_public_digital_twin_status(
    village_id: Optional[int] = Query(None),
    response: Response = None,
    db: Session = Depends(get_db)
):
    """
    Public-Safe Digital Twin Infrastructure Status:
    Provides transparent operational status for key village public services.
    """
    if response:
        response.headers["Cache-Control"] = "public, max-age=60"

    return public_trust_service.get_public_digital_twin_status(db, village_id=village_id)
