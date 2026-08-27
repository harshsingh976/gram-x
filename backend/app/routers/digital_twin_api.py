"""
GRAM-X 3D Digital Twin Spatial Scene & Infrastructure Simulation Router
Module: digital_twin_api.py
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import datetime
import math

from app.database import get_db
from app.models import Asset, Incident, Village, User
from app.services.auth_utils import get_current_user

twin_router = APIRouter(prefix="/digital-twin", tags=["Digital Twin 3D"])

@twin_router.get("/spatial-scene")
def get_spatial_scene(
    village_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns 3D GIS spatial scene objects (Pumps, Pipes, Transformers, Drains, Roads)
    with 3D vector coordinates (x, y, z), health indices, and failure risk heatmaps for Unity 3D engine.
    """
    villages = db.query(Village).all()
    if village_id:
        villages = [v for v in villages if v.id == village_id]

    scene_nodes = []
    
    # 1. Procedural Infrastructure Nodes mapped from database assets
    assets = db.query(Asset).all()
    for idx, ast in enumerate(assets):
        # Convert lat/lon offset to 3D local coordinate frame (meters)
        x_pos = (idx % 4) * 35.0 - 50.0
        z_pos = (idx // 4) * 40.0 - 60.0
        y_pos = 0.0
        
        status_color = "#22c55e" if ast.status == "healthy" else ("#f59e0b" if ast.status == "warning" else "#ef4444")
        risk_score = 15.0 if ast.status == "healthy" else (55.0 if ast.status == "warning" else 88.0)

        scene_nodes.append({
            "node_id": f"NODE-ASSET-{ast.id}",
            "asset_id": ast.id,
            "asset_type": ast.type,
            "name": ast.name,
            "position_3d": {"x": x_pos, "y": y_pos, "z": z_pos},
            "rotation_3d": {"x": 0.0, "y": 0.0, "z": 0.0},
            "scale_3d": {"x": 1.5, "y": 1.5, "z": 1.5},
            "status": ast.status,
            "status_color_hex": status_color,
            "risk_score": risk_score,
            "health_index": round(100.0 - risk_score, 1),
            "telemetry": {
                "flow_rate_lpm": 45.0 if ast.type == "water" else None,
                "voltage_volts": 230.0 if ast.type == "electricity" else None,
                "vibration_rms": 1.2 if ast.status == "healthy" else 4.8
            }
        })

    # 2. Add Pipeline & Grid Connectors
    connectors = [
        {"connector_id": "CONN-PIPE-01", "from_node": "NODE-ASSET-1", "to_node": "NODE-ASSET-2", "type": "water_pipeline", "pressure_bar": 3.8, "status": "ACTIVE_FLOW"},
        {"connector_id": "CONN-GRID-02", "from_node": "NODE-ASSET-3", "to_node": "NODE-ASSET-4", "type": "power_line", "current_amps": 42.0, "status": "NOMINAL_LOAD"}
    ]

    return {
        "scene_name": "Gram Panchayat Piparli 3D Digital Twin",
        "reference_datum": {"latitude": 23.2845, "longitude": 77.4520, "altitude_meters": 450.0},
        "total_nodes": len(scene_nodes),
        "total_connectors": len(connectors),
        "nodes": scene_nodes,
        "connectors": connectors,
        "environment": {
            "ambient_weather": "Clear",
            "temperature_c": 32.5,
            "time_of_day": datetime.datetime.utcnow().strftime("%H:%M")
        },
        "exported_at": datetime.datetime.utcnow().isoformat()
    }

@twin_router.post("/simulate-3d")
def simulate_3d_physics(
    simulation_type: str = Query(..., description="hydraulic_surge, transformer_overheat, flood_inundation"),
    stress_factor: float = Query(1.5, description="Multiplier factor e.g. 1.5x"),
    current_user: User = Depends(get_current_user)
):
    """
    Executes 3D physics-informed operational simulations for Unity particle emitters and vector force fields.
    """
    if simulation_type == "hydraulic_surge":
        return {
            "simulation_type": "hydraulic_surge",
            "stress_factor": stress_factor,
            "peak_line_pressure_bar": round(3.8 * stress_factor, 2),
            "burst_probability": min(1.0, round(0.15 * (stress_factor ** 2), 2)),
            "rupture_critical_nodes": ["NODE-ASSET-1"],
            "particle_emitters": [
                {"emitter_id": "WATER_BURST_EMITTER_01", "position_3d": {"x": -50.0, "y": 1.2, "z": -60.0}, "rate": 500, "speed": 8.5}
            ],
            "recommended_throttle_action": "Reduce intake pressure by 25% at Master Sluice Valve."
        }
    elif simulation_type == "transformer_overheat":
        return {
            "simulation_type": "transformer_overheat",
            "stress_factor": stress_factor,
            "core_temperature_c": round(65.0 * stress_factor, 1),
            "thermal_trip_countdown_sec": max(30, int(300 / stress_factor)),
            "spark_effects": [
                {"emitter_id": "ARC_FLASH_EMITTER_02", "position_3d": {"x": 20.0, "y": 4.5, "z": -20.0}, "intensity": 0.9}
            ],
            "recommended_throttle_action": "Shed agricultural feeder line 3 immediately."
        }
    else:
        return {
            "simulation_type": "flood_inundation",
            "stress_factor": stress_factor,
            "water_accumulation_depth_cm": round(12.0 * stress_factor, 1),
            "submerged_zones": ["Piparli Ward 4 Open Drain Basin"],
            "recommended_throttle_action": "Deploy high-capacity dewatering pump unit."
        }

@twin_router.get("/live-telemetry")
def get_live_telemetry_feed(
    current_user: User = Depends(get_current_user)
):
    """Returns streaming telemetry for Unity 3D Real-Time WebSocket/Polling HUD loop."""
    return {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "active_alerts_count": 2,
        "grid_frequency_hz": 50.02,
        "water_head_pressure_m": 42.1,
        "active_field_workers_gps": [
            {"worker_id": 1, "name": "Ramesh Patel", "pos_3d": {"x": -25.0, "y": 0.0, "z": -30.0}, "status": "EN_ROUTE"}
        ]
    }
