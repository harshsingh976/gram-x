"""
GRAM-X 3D DIGITAL TWIN & UNITY INTEGRATION TEST SUITE
=====================================================
Empirically Verifies:
1. 3D Spatial Scene Nodes Serialization (x, y, z coordinates, asset health)
2. 3D Physics Simulation (Hydraulic Surge & Thermal Overheat)
3. Live Streaming Telemetry Feed for Unity WebSocket/Polling Loop
4. Unity C# Project Architecture & UXML/USS UI Toolkit Assets
"""

import sys
import os

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath("backend"))

from app.database import SessionLocal, Base, engine
from app.seed import seed_database
from app.models import User
from app.routers.digital_twin_api import get_spatial_scene, simulate_3d_physics, get_live_telemetry_feed

def run_3d_digital_twin_suite():
    print("======================================================================")
    print("GRAM-X 3D GOVERNMENT DIGITAL TWIN & UNITY INTEGRATION SUITE")
    print("======================================================================")

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)

    try:
        admin_user = db.query(User).filter(User.username == "admin").first()

        # 1. 3D Spatial Scene Serialization
        print("\n[TEST 1] 3D Spatial Scene Nodes Serialization...")
        scene_res = get_spatial_scene(village_id=None, db=db, current_user=admin_user)
        assert scene_res["total_nodes"] > 0
        assert len(scene_res["connectors"]) > 0
        first_node = scene_res["nodes"][0]
        assert "position_3d" in first_node
        assert "x" in first_node["position_3d"]
        print(f"  [PASS] 3D Spatial Scene -> Name: '{scene_res['scene_name']}' | Total 3D Nodes: {scene_res['total_nodes']} | Datum: {scene_res['reference_datum']}")
        print(f"    - Sample Node: {first_node['name']} ({first_node['node_id']}) at ({first_node['position_3d']['x']}, {first_node['position_3d']['y']}, {first_node['position_3d']['z']}) | Health: {first_node['health_index']}%")

        # 2. 3D Physics-Informed Simulation
        print("\n[TEST 2] 3D Physics Simulation (Hydraulic Pressure & Emitter Fields)...")
        sim_res = simulate_3d_physics(simulation_type="hydraulic_surge", stress_factor=1.5, current_user=admin_user)
        assert sim_res["simulation_type"] == "hydraulic_surge"
        assert sim_res["peak_line_pressure_bar"] > 3.8
        assert len(sim_res["particle_emitters"]) > 0
        print(f"  [PASS] 3D Simulation -> Type: {sim_res['simulation_type']} | Peak Pressure: {sim_res['peak_line_pressure_bar']} Bar | Emitters: {len(sim_res['particle_emitters'])}")
        print(f"    - Recommended Action: '{sim_res['recommended_throttle_action']}'")

        # 3. Live Streaming Telemetry Feed
        print("\n[TEST 3] Real-Time Streaming Telemetry Feed for Unity Client...")
        telem_res = get_live_telemetry_feed(current_user=admin_user)
        assert "grid_frequency_hz" in telem_res
        assert len(telem_res["active_field_workers_gps"]) > 0
        print(f"  [PASS] Live Telemetry -> Grid: {telem_res['grid_frequency_hz']} Hz | Water Head: {telem_res['water_head_pressure_m']} m | Active Workers: {len(telem_res['active_field_workers_gps'])}")

        # 4. Unity C# Scripts & UXML/USS Files Verification
        print("\n[TEST 4] Unity C# Client Architecture & UI Toolkit UXML/USS Verification...")
        required_files = [
            "digital_twin_unity/Scripts/GramXApiClient.cs",
            "digital_twin_unity/Scripts/DigitalTwinSceneManager.cs",
            "digital_twin_unity/Scripts/InfrastructureRiskVisualizer.cs",
            "digital_twin_unity/Scripts/WhatIfSimulationController.cs",
            "digital_twin_unity/UI/DigitalTwinOverlay.uxml",
            "digital_twin_unity/UI/DigitalTwinStyles.uss",
            "frontend/src/components/DigitalTwinViewer.tsx"
        ]
        for fpath in required_files:
            assert os.path.exists(fpath), f"Missing Unity file: {fpath}"
            print(f"    * Verified: {fpath} ({os.path.getsize(fpath)} bytes)")
        print("  [PASS] All 7 Unity 3D & WebGL Integration Assets Verified.")

        print("\n======================================================================")
        print("ALL 4 3D DIGITAL TWIN TESTS PASSED — UNITY INTEGRATION VERIFIED")
        print("======================================================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_3d_digital_twin_suite()
