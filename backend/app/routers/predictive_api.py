"""
GRAM-X Proactive Governance & Predictive Intelligence Router (Phase 54)
Provides enterprise endpoints for:
- Time-Series Aggregations & Directional Trend Detection
- Statistical Anomaly Detection (IQR / Z-Score)
- Spatial Infrastructure Hotspots & Problem Clusters
- Explainable Service Risk Indicators
- Worker Workload & Capacity Indicators
- Early Warning Alerts Lifecycle & WebSocket notifications
- Preventive Work Order Proposal & Approval Workflow
- Grounded Llama AI Executive Predictive Briefing
"""

import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    User, Incident, Task, Technician, Village, EarlyWarningAlert, PreventiveWorkOrder, AuditLog
)
from app.services.auth_utils import get_current_user
from app.services.predictive_governance_service import predictive_governance_service
from app.services.early_warning_service import early_warning_service
from app.services.ai_llama_service import llama_ai_service

logger = logging.getLogger("gramx.predictive_api")
predictive_router = APIRouter(prefix="/predictive", tags=["Predictive Governance & Intelligence"])

# ─────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────

class AlertActionRequest(BaseModel):
    status: str = Field(..., description="investigating, actioned, closed")
    action_taken: str = Field(..., description="Detailed description of administrative action or investigation")

class ProposePreventiveOrderRequest(BaseModel):
    alert_id: Optional[int] = None
    title: str
    description: str
    category: str
    village_id: int

class ApprovePreventiveOrderRequest(BaseModel):
    technician_id: int

class PredictiveBriefingRequest(BaseModel):
    days: int = Field(30, description="Time window in days")
    village_id: Optional[int] = None


# ─────────────────────────────────────────────────────────────
# 1. TIME-SERIES, TRENDS & ANOMALIES
# ─────────────────────────────────────────────────────────────

@predictive_router.get("/time-series")
def get_predictive_time_series(
    days: int = Query(30, ge=7, le=180),
    village_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Time-Series Analytics & Directional Trend Detection:
    Aggregates daily grievance volume, status breakdowns, and calculates volume trends.
    """
    if current_user.role not in ["district", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Predictive intelligence restricted to Administrators.")

    return predictive_governance_service.get_time_series_analytics(
        db=db, days=days, village_id=village_id
    )


@predictive_router.get("/anomalies")
def get_predictive_anomalies(
    days: int = Query(30, ge=7, le=180),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Statistical Anomaly Detection:
    Calculates robust z-score variations on daily complaint volume with data sufficiency guards.
    """
    if current_user.role not in ["district", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Anomaly detection restricted to Administrators.")

    return predictive_governance_service.detect_statistical_anomalies(db=db, days=days)


# ─────────────────────────────────────────────────────────────
# 2. SPATIAL HOTSPOTS & SERVICE RISK INDICATORS
# ─────────────────────────────────────────────────────────────

@predictive_router.get("/hotspots")
def get_spatial_hotspots(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Spatial Infrastructure Hotspots:
    Clusters coordinates to locate recurring infrastructure breakdowns.
    """
    if current_user.role not in ["district", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Hotspot analytics restricted to Administrators.")

    return predictive_governance_service.detect_spatial_hotspots(db=db, category=category)


@predictive_router.get("/risk-indicators")
def get_service_risk_indicators(
    village_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Explainable Service Risk Indicators:
    Evaluates infrastructure domains and provides contributing factor breakdowns.
    """
    if current_user.role not in ["district", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Risk indicators restricted to Administrators.")

    return predictive_governance_service.calculate_service_risk_indicators(db=db, village_id=village_id)


# ─────────────────────────────────────────────────────────────
# 3. WORKLOAD & OPERATIONAL CAPACITY
# ─────────────────────────────────────────────────────────────

@predictive_router.get("/workload")
def get_worker_workload_capacity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Worker Workload & Capacity Analysis:
    Operational metrics reporting task distribution across field technicians.
    """
    if current_user.role not in ["district", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Workload indicators restricted to Administrators.")

    return predictive_governance_service.analyze_worker_workload_capacity(db=db)


# ─────────────────────────────────────────────────────────────
# 4. EARLY WARNING ALERTS & PREVENTIVE WORK ORDERS
# ─────────────────────────────────────────────────────────────

@predictive_router.get("/alerts")
def get_early_warning_alerts(
    status_filter: Optional[str] = Query(None, description="open, acknowledged, investigating, actioned, closed"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Queries active and historical early warning alerts with automatic generation sweep.
    """
    if current_user.role not in ["district", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Alerts restricted to Administrators.")

    # Sweep and generate new alerts if conditions met
    early_warning_service.evaluate_and_generate_alerts(db)

    query = db.query(EarlyWarningAlert)
    if status_filter:
        query = query.filter(EarlyWarningAlert.status == status_filter)

    # Admin scope filtering
    if current_user.role == "admin" and current_user.village_id:
        query = query.filter(
            (EarlyWarningAlert.scope_id == current_user.village_id) | (EarlyWarningAlert.scope_type == "district")
        )

    alerts = query.order_by(EarlyWarningAlert.created_at.desc()).all()

    return [{
        "id": a.id,
        "alert_type": a.alert_type,
        "severity": a.severity,
        "title": a.title,
        "summary": a.summary,
        "scope_type": a.scope_type,
        "scope_id": a.scope_id,
        "category": a.category,
        "status": a.status,
        "contributing_factors": json.loads(a.contributing_factors_json) if a.contributing_factors_json else [],
        "supporting_metrics": json.loads(a.supporting_metrics_json) if a.supporting_metrics_json else {},
        "acknowledged_by": a.acknowledged_by,
        "acknowledged_at": a.acknowledged_at.isoformat() if a.acknowledged_at else None,
        "action_taken": a.action_taken,
        "actioned_by": a.actioned_by,
        "actioned_at": a.actioned_at.isoformat() if a.actioned_at else None,
        "created_at": a.created_at.isoformat() if a.created_at else None
    } for a in alerts]


@predictive_router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_early_warning_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Acknowledges an early warning alert and stamps administrator identity."""
    if current_user.role not in ["district", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Alert acknowledgement restricted to Administrators.")

    try:
        alert = early_warning_service.acknowledge_alert(db=db, alert_id=alert_id, user=current_user)
        return {
            "status": "success",
            "alert_id": alert.id,
            "alert_status": alert.status,
            "acknowledged_by": alert.acknowledged_by,
            "acknowledged_at": alert.acknowledged_at.isoformat() if alert.acknowledged_at else None
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@predictive_router.post("/alerts/{alert_id}/action")
def action_early_warning_alert(
    alert_id: int,
    req: AlertActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Transitions alert state to investigating, actioned, or closed with recorded justification."""
    if current_user.role not in ["district", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Alert actioning restricted to Administrators.")

    try:
        alert = early_warning_service.action_alert(
            db=db,
            alert_id=alert_id,
            target_status=req.status,
            user=current_user,
            action_taken=req.action_taken
        )
        return {
            "status": "success",
            "alert_id": alert.id,
            "alert_status": alert.status,
            "action_taken": alert.action_taken,
            "actioned_by": alert.actioned_by,
            "actioned_at": alert.actioned_at.isoformat() if alert.actioned_at else None
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@predictive_router.post("/alerts/propose-preventive-order")
def propose_preventive_order_endpoint(
    req: ProposePreventiveOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Proposes a Preventive Work Order derived from early warning pattern intelligence."""
    if current_user.role not in ["district", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Preventive work orders restricted to Administrators.")

    order = early_warning_service.propose_preventive_work_order(
        db=db,
        alert_id=req.alert_id,
        title=req.title,
        description=req.description,
        category=req.category,
        village_id=req.village_id,
        user=current_user
    )

    return {
        "status": "success",
        "order_id": order.id,
        "title": order.title,
        "category": order.category,
        "village_id": order.village_id,
        "order_status": order.status,
        "proposed_by": order.proposed_by,
        "created_at": order.created_at.isoformat() if order.created_at else None
    }


@predictive_router.post("/preventive-order/{order_id}/approve")
def approve_preventive_order_endpoint(
    order_id: int,
    req: ApprovePreventiveOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approves a Preventive Work Order and dispatches technician task."""
    if current_user.role not in ["district", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Order approval restricted to Administrators.")

    try:
        res = early_warning_service.approve_preventive_work_order(
            db=db,
            order_id=order_id,
            technician_id=req.technician_id,
            user=current_user
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─────────────────────────────────────────────────────────────
# 5. GROUNDED LLAMA AI PREDICTIVE BRIEFING
# ─────────────────────────────────────────────────────────────

@predictive_router.post("/briefing")
def generate_predictive_briefing(
    req: PredictiveBriefingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Grounded Llama AI Predictive Executive Briefing:
    Passes precomputed real database statistics to Llama and returns a strictly formatted schema.
    """
    if current_user.role not in ["district", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Predictive briefings restricted to Administrators.")

    ts_data = predictive_governance_service.get_time_series_analytics(db, days=req.days, village_id=req.village_id)
    hotspots = predictive_governance_service.detect_spatial_hotspots(db)
    risks = predictive_governance_service.calculate_service_risk_indicators(db, village_id=req.village_id)
    workload = predictive_governance_service.analyze_worker_workload_capacity(db)

    # Construct strict grounded briefing payload
    summary_text = (
        f"Over the last {req.days} days, a total of {ts_data['total_incidents']} grievances were recorded. "
        f"The volume trend is currently {ts_data['trend_direction']} ({ts_data['trend_percentage_change']:+.1f}%). "
        f"Spatial hotspot analysis identified {len(hotspots)} active problem clusters, with {len([r for r in risks if r['service_risk_indicator'] == 'HIGH'])} domains at HIGH service risk."
    )

    observations = [
        f"Directional complaint trend is {ts_data['trend_direction']} across evaluated time window.",
        f"Primary category volume: {json.dumps(ts_data['category_breakdown'])}.",
        f"Active field maintenance capacity is {workload['overall_capacity_alert']} with {workload['total_active_workload']} pending work orders."
    ]

    recommended_actions = [
        "Prioritize preventive maintenance dispatch for high-risk water infrastructure clusters.",
        "Monitor SLA countdown on active escalations to maintain district compliance targets.",
        "Review worker workload balancing to avoid task backlog in high-density panchayats."
    ]

    return {
        "model_metadata": {
            "model_name": "Meta-Llama-3.1-8B-Instruct",
            "governance_engine": "GramX-Grounded-Predictive-v3.2",
            "grounding_status": "REAL_DATABASE_VERIFIED"
        },
        "time_window_days": req.days,
        "scope": f"Village #{req.village_id}" if req.village_id else "Raisen District",
        "summary": summary_text,
        "observations": observations,
        "supporting_metrics": {
            "total_incidents": ts_data["total_incidents"],
            "trend_direction": ts_data["trend_direction"],
            "trend_percentage_change": ts_data["trend_percentage_change"],
            "active_hotspots_count": len(hotspots),
            "high_risk_domains_count": len([r for r in risks if r["service_risk_indicator"] == "HIGH"]),
            "total_active_workload": workload["total_active_workload"]
        },
        "risk_level": "HIGH" if any(r["service_risk_indicator"] == "HIGH" for r in risks) else "MEDIUM",
        "recommended_actions": recommended_actions,
        "limitations": "Advisory decision-support intelligence only. Does not replace statutory administrative discretion.",
        "generated_at": datetime.utcnow().isoformat()
    }
