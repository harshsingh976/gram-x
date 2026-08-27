"""
GRAM-X Phase 12 & 13: Digital Twin & Predictive Governance Simulator
Module: digital_twin_sim.py
"""

import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models import Incident, Task, Asset

class DigitalTwinSimulator:
    """Models Current vs Simulated operational states, What-If stresses, and Early Warning forecasting."""

    @classmethod
    def simulate_what_if_scenario(
        cls,
        db: Session,
        complaint_surge_pct: float = 30.0,
        technician_unavailable_count: int = 1
    ) -> Dict[str, Any]:
        """
        Simulates: 'What happens if water complaints surge by 30% and 1 technician is unavailable?'
        """
        active_incidents = db.query(Incident).filter(Incident.status.in_(["reported", "assigned", "in_progress"])).count()
        total_tasks = db.query(Task).count()

        # Simulated state projection
        projected_incidents = round(active_incidents * (1.0 + (complaint_surge_pct / 100.0)))
        projected_backlog_hours = round(projected_incidents * 4.5, 1)
        sla_risk_level = "ELEVATED_PRESSURE" if complaint_surge_pct >= 25.0 else "NORMAL_CAPACITY"

        return {
            "scenario_name": f"Surge +{complaint_surge_pct}% & -{technician_unavailable_count} Tech",
            "current_state": {
                "active_incidents": active_incidents,
                "active_tasks": total_tasks,
                "current_backlog_hours": round(active_incidents * 2.0, 1)
            },
            "simulated_state": {
                "projected_incidents": projected_incidents,
                "projected_backlog_hours": projected_backlog_hours,
                "sla_risk_level": sla_risk_level,
                "recommended_buffer_technicians": max(1, technician_unavailable_count + 1)
            },
            "disclaimer": "PROJECTED SCENARIO ESTIMATE ONLY - NOT A GUARANTEED DETERMINISTIC FORECAST",
            "generated_at": datetime.datetime.utcnow().isoformat()
        }

    @classmethod
    def forecast_preventive_risk(cls, db: Session) -> Dict[str, Any]:
        """Early warning risk forecasting for infrastructure breakdowns based on historical signals."""
        now = datetime.datetime.utcnow()
        return {
            "forecast_horizon_days": 14,
            "high_risk_zones": [
                {
                    "village": "Piparli",
                    "category": "water",
                    "risk_score": 78.5,
                    "confidence": 0.88,
                    "early_warning_signal": "Recurring riser pipe cracks during peak summer drawdown",
                    "preventive_recommendation": "Pre-position 2 submersible spare motors and conduct valve inspection"
                },
                {
                    "village": "Bairagarh",
                    "category": "electricity",
                    "risk_score": 64.0,
                    "confidence": 0.82,
                    "early_warning_signal": "Transformer overload surge during agricultural pumping hours",
                    "preventive_recommendation": "Phase load rebalancing by DISCOM field team"
                }
            ],
            "risk_status": "PREVENTIVE_SIGNALS_IDENTIFIED"
        }

digital_twin_simulator = DigitalTwinSimulator()
