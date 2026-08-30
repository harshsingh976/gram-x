import datetime
import random
import json
from sqlalchemy.orm import Session
import bcrypt
from app.database import Base, engine, SessionLocal
from app.models import (
    User, Village, Asset, Household, SensorReading, 
    Incident, IncidentEvidence, Project, ProjectMilestone, 
    ProjectOutcome, Technician, Task, MaintenanceHistory,
    VerificationRecord, AuditLog, KnowledgeArticle
)
from app.services.mongo_service import mongo_service

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed_database(db: Session):
    from app.seed_1000_users import seed_1000_database
    seed_1000_database(db)

    # 1. Create Villages
    # Coordinates centered around Madhya Pradesh/Bhopal region (lat: 23.25, lng: 77.41)
    villages_data = [
        {"name": "Piparli", "district": "Raisen", "state": "Madhya Pradesh", "population": 1250, "budget_allocated": 250000.0, "budget_spent": 145000.0, "lat": 23.285, "lng": 77.452},
        {"name": "Ramnagar", "district": "Raisen", "state": "Madhya Pradesh", "population": 840, "budget_allocated": 180000.0, "budget_spent": 90000.0, "lat": 23.298, "lng": 77.475},
        {"name": "Haripura", "district": "Raisen", "state": "Madhya Pradesh", "population": 1500, "budget_allocated": 320000.0, "budget_spent": 210000.0, "lat": 23.262, "lng": 77.421},
        {"name": "Madanpur", "district": "Raisen", "state": "Madhya Pradesh", "population": 980, "budget_allocated": 150000.0, "budget_spent": 60000.0, "lat": 23.310, "lng": 77.435},
        {"name": "Khajuraho Rural", "district": "Chhatarpur", "state": "Madhya Pradesh", "population": 2100, "budget_allocated": 450000.0, "budget_spent": 310000.0, "lat": 24.851, "lng": 79.924}
    ]

    villages = []
    for vd in villages_data:
        # Generate simple shape geojson (a square box boundary around the village center)
        lat, lng = vd["lat"], vd["lng"]
        d = 0.015 # offset
        geojson = {
            "type": "Feature",
            "properties": {"name": vd["name"]},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [lng - d, lat - d],
                    [lng + d, lat - d],
                    [lng + d, lat + d],
                    [lng - d, lat + d],
                    [lng - d, lat - d]
                ]]
            }
        }
        
        v = Village(
            name=vd["name"],
            district=vd["district"],
            state=vd["state"],
            population=vd["population"],
            budget_allocated=vd["budget_allocated"],
            budget_spent=vd["budget_spent"],
            shape_geojson=json.dumps(geojson)
        )
        db.add(v)
        villages.append(v)
    
    db.commit()
    # Refresh to get IDs
    for v in villages:
        db.refresh(v)

    # 2. Create Users
    # Panchayat admin, citizen, worker for Piparli (Village ID 1)
    piparli_id = villages[0].id
    
    users_data = [
        {"username": "admin", "email": "admin@gramx.gov.in", "name": "Rajesh Kumar (Panchayat Sec.)", "role": "admin", "password": "admin123", "village_id": piparli_id},
        {"username": "citizen", "email": "citizen@gramx.gov.in", "name": "Sunita Devi (Citizen)", "role": "citizen", "password": "citizen123", "village_id": piparli_id},
        {"username": "worker", "email": "worker@gramx.gov.in", "name": "Suresh Kumar (Plumber/Technician)", "role": "worker", "password": "worker123", "village_id": piparli_id},
        {"username": "district", "email": "collector@gramx.gov.in", "name": "District Collector Raisen", "role": "district", "password": "district123", "village_id": None},
        {"username": "superadmin", "email": "superadmin@gramx.gov.in", "name": "System Super Admin", "role": "super_admin", "password": "superadmin123", "village_id": None}
    ]

    users = []
    for ud in users_data:
        u = User(
            username=ud["username"],
            email=ud["email"],
            name=ud["name"],
            role=ud["role"],
            password_hash=get_password_hash(ud["password"]),
            village_id=ud["village_id"],
            is_active=True,
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow()
        )
        db.add(u)
        users.append(u)
    
    db.commit()
    for u in users:
        db.refresh(u)

    # 3. Create Technicians (Workers)
    tech_data = [
        {"user_idx": 2, "specialty": "water", "lat": 23.288, "lng": 77.458, "rating": 4.8}, # Suresh Kumar
        {"name": "Amit Sharma", "username": "amit_tech", "specialty": "electrical", "lat": 23.282, "lng": 77.448, "rating": 4.6, "village_id": piparli_id},
        {"name": "Ramesh Patel", "username": "ramesh_tech", "specialty": "construction", "lat": 23.292, "lng": 77.462, "rating": 4.4, "village_id": piparli_id},
        {"name": "Vikram Singh", "username": "vikram_tech", "specialty": "sanitation", "lat": 23.275, "lng": 77.439, "rating": 4.9, "village_id": piparli_id}
    ]

    technicians = []
    # First, Suresh Kumar who has a User record
    tech_suresh = Technician(
        user_id=users[2].id,
        specialty=tech_data[0]["specialty"],
        availability=True,
        current_lat=tech_data[0]["lat"],
        current_lng=tech_data[0]["lng"],
        rating=tech_data[0]["rating"]
    )
    db.add(tech_suresh)
    technicians.append(tech_suresh)

    # Create User accounts for others
    for td in tech_data[1:]:
        u_tech = User(
            username=td["username"],
            name=td["name"],
            role="worker",
            password_hash=get_password_hash("worker123"),
            village_id=td["village_id"]
        )
        db.add(u_tech)
        db.commit()
        db.refresh(u_tech)

        tech = Technician(
            user_id=u_tech.id,
            specialty=td["specialty"],
            availability=True,
            current_lat=td["lat"],
            current_lng=td["lng"],
            rating=td["rating"]
        )
        db.add(tech)
        technicians.append(tech)
    
    db.commit()

    # 4. Create Assets in villages
    # Focus heavily on Piparli (villages[0]) for the detailed demo
    assets = []
    
    # Piparli Assets
    piparli_assets = [
        # Water Assets
        {"name": "Borewell Water Pump #17", "type": "water_pump", "status": "operational", "lat": 23.284, "lng": 77.451, "capacity": 5000.0, "utilization": 75.0},
        {"name": "Community Handpump A", "type": "water_pump", "status": "operational", "lat": 23.289, "lng": 77.442, "capacity": 800.0, "utilization": 85.0},
        {"name": "Water Purification Plant", "type": "water_pump", "status": "operational", "lat": 23.279, "lng": 77.458, "capacity": 10000.0, "utilization": 40.0},
        # Streetlights
        {"name": "Streetlight Row Zone B", "type": "streetlight", "status": "operational", "lat": 23.286, "lng": 77.448, "capacity": 0.5, "utilization": 100.0},
        {"name": "Solar Streetlight Chowk", "type": "streetlight", "status": "operational", "lat": 23.281, "lng": 77.453, "capacity": 0.1, "utilization": 100.0},
        # Public Buildings
        {"name": "Panchayat Community Hall", "type": "school_building", "status": "operational", "lat": 23.283, "lng": 77.452, "capacity": 200.0, "utilization": 25.0}, # Candidate for reuse!
        {"name": "Government Primary School", "type": "school_building", "status": "operational", "lat": 23.291, "lng": 77.446, "capacity": 150.0, "utilization": 90.0},
        # Drains & Roads
        {"name": "Main Market Drainage Line", "type": "drain", "status": "degraded", "lat": 23.285, "lng": 77.449, "capacity": 1000.0, "utilization": 95.0},
        {"name": "Piparli-Ramnagar Link Road", "type": "road_segment", "status": "degraded", "lat": 23.292, "lng": 77.463, "capacity": 2000.0, "utilization": 80.0}
    ]

    for pa in piparli_assets:
        asset = Asset(
            name=pa["name"],
            type=pa["type"],
            village_id=piparli_id,
            status=pa["status"],
            latitude=pa["lat"],
            longitude=pa["lng"],
            capacity=pa["capacity"],
            current_utilization=pa["utilization"],
            install_date=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(180, 1000))
        )
        db.add(asset)
        assets.append(asset)

    # Assets in other villages (simplified)
    other_asset_types = [
        ("Community Handpump", "water_pump"),
        ("Solar Streetlight", "streetlight"),
        ("Village Sub-Center School", "school_building"),
        ("Open Drainage Canal", "drain"),
        ("Internal Village Road", "road_segment")
    ]
    
    for v_idx, v in enumerate(villages[1:]):
        # Center coordinates
        v_lat, v_lng = villages_data[v_idx + 1]["lat"], villages_data[v_idx + 1]["lng"]
        for idx, (name, atype) in enumerate(other_asset_types):
            asset = Asset(
                name=f"{v.name} {name} {idx+1}",
                type=atype,
                village_id=v.id,
                status="operational",
                latitude=v_lat + random.uniform(-0.008, 0.008),
                longitude=v_lng + random.uniform(-0.008, 0.008),
                capacity=1000.0 if atype in ["water_pump", "drain"] else 100.0,
                current_utilization=random.uniform(30.0, 85.0),
                install_date=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(180, 1000))
            )
            db.add(asset)
            assets.append(asset)
            
    db.commit()
    for a in assets:
        db.refresh(a)

    # Find Pump 17 & Hall in the list
    pump_17 = next(a for a in assets if "Pump #17" in a.name)
    comm_hall = next(a for a in assets if "Community Hall" in a.name)

    # 5. Create Households mapped to water sources
    # We will seed 100 households in Piparli, most mapped to Pump 17 or Handpump A
    handpump_a = next(a for a in assets if "Handpump A" in a.name)
    
    for i in range(100):
        # 60% of households depend on Pump 17, 30% on Handpump A, 10% on Purification plant
        if i < 60:
            source_id = pump_17.id
        elif i < 90:
            source_id = handpump_a.id
        else:
            source_id = assets[2].id # Purification Plant
            
        hh = Household(
            village_id=piparli_id,
            members_count=random.randint(3, 8),
            income_level=random.choice(["BPL", "APL", "APL", "BPL"]),
            primary_water_source_id=source_id
        )
        db.add(hh)

    # Seed fewer households for other villages just for consistency
    for v in villages[1:]:
        v_water_assets = [a.id for a in assets if a.village_id == v.id and a.type == "water_pump"]
        if v_water_assets:
            for _ in range(20):
                hh = Household(
                    village_id=v.id,
                    members_count=random.randint(3, 7),
                    income_level=random.choice(["BPL", "APL"]),
                    primary_water_source_id=random.choice(v_water_assets)
                )
                db.add(hh)
                
    db.commit()

    # 6. Create Historical Maintenance Records for Pump #17
    # " failures this year: 4, repairs: 4, average failure interval: 19 days, maintenance cost: 8400"
    maintenance_records = [
        {"days_ago": 120, "action": "Submersible cable replacement", "cost": 1500.0},
        {"days_ago": 101, "action": "Motor winding repair", "cost": 2800.0},
        {"days_ago": 82, "action": "Control panel capacitor replacement", "cost": 1100.0},
        {"days_ago": 63, "action": "Bearing replacement and lubrication", "cost": 3000.0}
    ]
    for mr in maintenance_records:
        mh = MaintenanceHistory(
            asset_id=pump_17.id,
            date=datetime.datetime.utcnow() - datetime.timedelta(days=mr["days_ago"]),
            action_taken=mr["action"],
            cost=mr["cost"],
            technician_id=tech_suresh.id
        )
        db.add(mh)

    # 7. Create Sensor Readings for assets
    # Pump #17 normal readings (flow_rate=80 l/min, runtime=6 hrs/day)
    # We will generate readings for the last 7 days
    now = datetime.datetime.utcnow()
    for day in range(7):
        ts = now - datetime.timedelta(days=day)
        # Pump #17 Normal
        db.add(SensorReading(asset_id=pump_17.id, parameter="flow_rate", value=82.4 + random.uniform(-2, 2), timestamp=ts))
        db.add(SensorReading(asset_id=pump_17.id, parameter="runtime_hours", value=6.2 + random.uniform(-0.5, 0.5), timestamp=ts))
        
        # Streetlight Row Zone B
        db.add(SensorReading(asset_id=assets[3].id, parameter="lux", value=0.1 if ts.hour in range(6,18) else 150.0, timestamp=ts))
        
    db.commit()

    # 8. Create Projects (with Outcome Gaps and completed states)
    # Project 1: Pipe water distribution in Piparli (Outcome Gap)
    p1 = Project(
        title="Main Street Water Pipeline Extension",
        description="Laying 1.2km pipelines to connect Ward 4 and Ward 5 to the Purification Plant.",
        village_id=piparli_id,
        cost_estimate=95000.0,
        start_date=now - datetime.timedelta(days=90),
        end_date=now - datetime.timedelta(days=15),
        status="completed",
        physical_progress_pct=100.0,
        functional_status_pct=68.0,  # Functional status
        actual_usage_pct=51.0,       # Actual usage
        outcome_verified=False
    )
    db.add(p1)
    db.commit()
    db.refresh(p1)

    # Milestones for Project 1
    m1_1 = ProjectMilestone(project_id=p1.id, title="Excavation and trenching", target_date=now - datetime.timedelta(days=75), status="completed", actual_date=now - datetime.timedelta(days=73))
    m1_2 = ProjectMilestone(project_id=p1.id, title="Pipe laying & alignment", target_date=now - datetime.timedelta(days=45), status="completed", actual_date=now - datetime.timedelta(days=43))
    m1_3 = ProjectMilestone(project_id=p1.id, title="Connection to reservoir & pressure test", target_date=now - datetime.timedelta(days=15), status="completed", actual_date=now - datetime.timedelta(days=15))
    db.add_all([m1_1, m1_2, m1_3])

    # Outcomes for Project 1 (Outcome Gap example)
    o1_1 = ProjectOutcome(project_id=p1.id, metric_name="Households with direct water tap connection", target_value=120.0, observed_value=82.0, verification_method="Field worker survey + IoT water meter count", status="outcome_gap")
    o1_2 = ProjectOutcome(project_id=p1.id, metric_name="Average water supply duration (mins/day)", target_value=60.0, observed_value=40.0, verification_method="Flow-sensor logging", status="outcome_gap")
    db.add_all([o1_1, o1_2])

    # Project 2: Solar Streetlight Installation (Successful)
    p2 = Project(
        title="High-Mast Solar Streetlight Installation at Bazaar Chowk",
        description="Installation of high capacity solar poles at market crossings for female safety.",
        village_id=piparli_id,
        cost_estimate=50000.0,
        start_date=now - datetime.timedelta(days=45),
        end_date=now - datetime.timedelta(days=10),
        status="completed",
        physical_progress_pct=100.0,
        functional_status_pct=100.0,
        actual_usage_pct=100.0,
        outcome_verified=True
    )
    db.add(p2)
    db.commit()
    db.refresh(p2)

    o2_1 = ProjectOutcome(project_id=p2.id, metric_name="Active night illumination area (sq m)", target_value=500.0, observed_value=510.0, verification_method="Lux sensor & satellite visual mapping", status="verified")
    db.add(o2_1)

    # Project 3: School Building renovation (Active)
    p3 = Project(
        title="Primary School Roof Leakage Repair & Smart Classroom",
        description="Roof waterproofing and setting up a projector + 5 computers.",
        village_id=piparli_id,
        cost_estimate=120000.0,
        start_date=now - datetime.timedelta(days=20),
        status="in_progress",
        physical_progress_pct=45.0,
        functional_status_pct=0.0,
        actual_usage_pct=0.0,
        outcome_verified=False
    )
    db.add(p3)
    db.commit()

    # 9. Create Historical/Recurring Incidents
    # Cluster A: Water Infrastructure Failure in Piparli (Pump #17)
    inc_wtr_1 = Incident(
        title="Borewell Pump #17 Motor Winding Coil Burnt",
        description="Voltage drop caused motor burnout in submersible borehole assembly.",
        category="water",
        status="resolved",
        severity="critical",
        reporter_id=users[1].id,
        asset_id=pump_17.id,
        village_id=piparli_id,
        latitude=23.2848,
        longitude=77.4510,
        created_at=now - datetime.timedelta(days=50),
        resolved_at=now - datetime.timedelta(days=47),
        ai_confidence=0.98,
        affected_population=740,
        priority_score=88.5
    )
    db.add(inc_wtr_1)
    db.commit()
    db.refresh(inc_wtr_1)
    task_wtr_1 = Task(
        incident_id=inc_wtr_1.id,
        technician_id=tech_suresh.id,
        description="Rewind submersible motor coil and replace thermal fuse.",
        status="completed",
        assigned_at=now - datetime.timedelta(days=50),
        completed_at=now - datetime.timedelta(days=47),
        cost=15400.0,
        payout_status="paid",
        payout_tx_id=f"TXN-GP-PUMP17-1"
    )
    db.add(task_wtr_1)

    inc_wtr_2 = Incident(
        title="Pump #17 Severe Low Pressure & Cavitation",
        description="Impeller worn down with sand ingress causing severe low pressure across Ward 4.",
        category="water",
        status="resolved",
        severity="high",
        reporter_id=users[1].id,
        asset_id=pump_17.id,
        village_id=piparli_id,
        latitude=23.2850,
        longitude=77.4515,
        created_at=now - datetime.timedelta(days=30),
        resolved_at=now - datetime.timedelta(days=28),
        ai_confidence=0.94,
        affected_population=680,
        priority_score=82.0
    )
    db.add(inc_wtr_2)
    db.commit()
    db.refresh(inc_wtr_2)
    task_wtr_2 = Task(
        incident_id=inc_wtr_2.id,
        technician_id=tech_suresh.id,
        description="Replace bronze impeller and clean borehole strainer.",
        status="completed",
        assigned_at=now - datetime.timedelta(days=30),
        completed_at=now - datetime.timedelta(days=28),
        cost=14800.0,
        payout_status="paid",
        payout_tx_id=f"TXN-GP-PUMP17-2"
    )
    db.add(task_wtr_2)

    inc_wtr_3 = Incident(
        title="Main Street Water Pipeline Joint Fracture",
        description="High pressure surge from pump restart fractured 3-inch PVC distribution collar.",
        category="water",
        status="resolved",
        severity="high",
        reporter_id=users[1].id,
        asset_id=pump_17.id,
        village_id=piparli_id,
        latitude=23.2855,
        longitude=77.4520,
        created_at=now - datetime.timedelta(days=14),
        resolved_at=now - datetime.timedelta(days=12),
        ai_confidence=0.92,
        affected_population=520,
        priority_score=78.0
    )
    db.add(inc_wtr_3)
    db.commit()
    db.refresh(inc_wtr_3)
    task_wtr_3 = Task(
        incident_id=inc_wtr_3.id,
        technician_id=tech_suresh.id,
        description="Clamp fracture with cast iron collar.",
        status="completed",
        assigned_at=now - datetime.timedelta(days=14),
        completed_at=now - datetime.timedelta(days=12),
        cost=12000.0,
        payout_status="paid",
        payout_tx_id=f"TXN-GP-PUMP17-3"
    )
    db.add(task_wtr_3)
    # Flag outcome gap on this quick patch
    db.add(VerificationRecord(
        incident_id=inc_wtr_3.id,
        verifier="Sunita Devi (Citizen)",
        verification_status="outcome_gap",
        remarks="Collar still weeping water during morning pumping hours.",
        verified_at=now - datetime.timedelta(days=10)
    ))

    # Cluster B: Drainage Channel Failures in Piparli
    inc_drain_old = Incident(
        title="Ward 3 Silt & Mud Accumulation in Storm Drain",
        description="Pre-monsoon runoff clogged drain culvert behind primary school.",
        category="drainage",
        status="resolved",
        severity="medium",
        reporter_id=users[1].id,
        asset_id=assets[7].id,
        village_id=piparli_id,
        latitude=23.2840,
        longitude=77.4480,
        created_at=now - datetime.timedelta(days=40),
        resolved_at=now - datetime.timedelta(days=38),
        ai_confidence=0.91,
        affected_population=210,
        priority_score=52.0
    )
    db.add(inc_drain_old)
    db.commit()
    db.refresh(inc_drain_old)
    db.add(Task(
        incident_id=inc_drain_old.id,
        technician_id=technicians[3].id, # Vikram (sanitation)
        description="Manual desilting of 150m culvert.",
        status="completed",
        assigned_at=now - datetime.timedelta(days=40),
        completed_at=now - datetime.timedelta(days=38),
        cost=8500.0,
        payout_status="paid",
        payout_tx_id="TXN-GP-DRN-1"
    ))

    inc_drain_mid = Incident(
        title="Market Square Stormwater Drain Silt Obstruction",
        description="Heavy runoff backed up water into market stalls.",
        category="drainage",
        status="resolved",
        severity="medium",
        reporter_id=users[1].id,
        asset_id=assets[7].id,
        village_id=piparli_id,
        latitude=23.2845,
        longitude=77.4485,
        created_at=now - datetime.timedelta(days=18),
        resolved_at=now - datetime.timedelta(days=16),
        ai_confidence=0.88,
        affected_population=240,
        priority_score=58.0
    )
    db.add(inc_drain_mid)
    db.commit()
    db.refresh(inc_drain_mid)
    db.add(Task(
        incident_id=inc_drain_mid.id,
        technician_id=technicians[3].id,
        description="De-clogging and gravel removal.",
        status="completed",
        assigned_at=now - datetime.timedelta(days=18),
        completed_at=now - datetime.timedelta(days=16),
        cost=9200.0,
        payout_status="paid",
        payout_tx_id="TXN-GP-DRN-2"
    ))

    # Active Drainage Incident
    inc_drain = Incident(
        title="Market drain clogged with plastic garbage",
        description="Severe waterlogging near market stalls due to accumulation of single-use plastic cups and bags in open drain.",
        category="drainage",
        status="pending_verification",
        severity="medium",
        reporter_id=users[1].id,
        asset_id=assets[7].id,
        village_id=piparli_id,
        latitude=23.2852,
        longitude=77.4491,
        created_at=now - datetime.timedelta(days=1),
        ai_confidence=0.89,
        affected_population=180,
        priority_score=48.5
    )
    db.add(inc_drain)
    db.commit()
    db.refresh(inc_drain)

    ev_drain = IncidentEvidence(
        incident_id=inc_drain.id,
        type="photo",
        file_path="mock_evidence_drain.jpg",
        recognized_text="Drainage block detected. High probability of stagnant water.",
        ai_metadata=json.dumps({"objects_detected": ["garbage_pile", "waterlog"], "confidence": 0.89})
    )
    db.add(ev_drain)

    # Road Incident
    inc_road = Incident(
        title="Deep potholes on Piparli-Ramnagar Link Road",
        description="Multiple deep potholes formed after heavy monsoon rains, causing two motorcycle accidents yesterday.",
        category="roads",
        status="verified",
        severity="high",
        reporter_id=users[1].id,
        asset_id=assets[8].id,
        village_id=piparli_id,
        latitude=23.2925,
        longitude=77.4638,
        created_at=now - datetime.timedelta(days=3),
        ai_confidence=0.95,
        affected_population=450,
        priority_score=72.0
    )
    db.add(inc_road)
    db.commit()
    db.refresh(inc_road)

    ev_road = IncidentEvidence(
        incident_id=inc_road.id,
        type="photo",
        file_path="mock_evidence_road.jpg",
        recognized_text="Potholes detected (3). Estimated depth: 8-15cm. Hazardous road conditions.",
        ai_metadata=json.dumps({"objects_detected": ["pothole"], "count": 3, "confidence": 0.95})
    )
    db.add(ev_road)

    # Streetlight Incident
    inc_light = Incident(
        title="Streetlight broken near temple chowk",
        description="Bulb shattered. Area is pitch dark at night, causing safety concerns for women and elderly.",
        category="electricity",
        status="resolved",
        severity="medium",
        reporter_id=users[1].id,
        asset_id=assets[4].id,
        village_id=piparli_id,
        latitude=23.2815,
        longitude=77.4532,
        created_at=now - datetime.timedelta(days=10),
        resolved_at=now - datetime.timedelta(days=8),
        ai_confidence=0.99,
        affected_population=300,
        priority_score=55.0
    )
    db.add(inc_light)
    db.commit()
    db.refresh(inc_light)

    task_light = Task(
        incident_id=inc_light.id,
        technician_id=technicians[1].id,
        description="Replace broken CFL/LED bulb with high-efficiency 18W solar LED module.",
        status="completed",
        assigned_at=now - datetime.timedelta(days=10),
        completed_at=now - datetime.timedelta(days=8),
        cost=1800.0,
        payout_status="paid",
        payout_tx_id="TXN-GP-LT-1"
    )
    db.add(task_light)

    # 10. Seed Government Knowledge Base Articles for Semantic Vector Search
    knowledge_articles_data = [
        {
            "title": "Jal Jeevan Mission (JJM) Rural Water Supply Guidelines",
            "category": "schemes",
            "department": "Department of Drinking Water & Sanitation",
            "content": "Jal Jeevan Mission aims to provide Functional Household Tap Connection (FHTC) to every rural household. Guidelines require 55 liters per capita per day (lpcd) of potable drinking water on a long-term basis. In case of pipe leakage or motor pump failures, Gram Panchayat technicians must address complaints within a strict 48-hour SLA.",
            "summary": "Mandatory 55 lpcd potable water supply per household with 48h SLA for repairs.",
            "role_visibility": "all"
        },
        {
            "title": "Pradhan Mantri Gram Sadak Yojana (PMGSY) Road Maintenance SOP",
            "category": "sops",
            "department": "Ministry of Rural Development",
            "content": "Rural road maintenance standards specify that all asphalt defects, potholes exceeding 5cm depth, and shoulder erosion must be documented with geotagged photographic evidence prior to asphalt patch repair. Post-repair compaction must be verified before payment release.",
            "summary": "Standard operating procedure for rural asphalt repair with geotagged photo verification.",
            "role_visibility": "all"
        },
        {
            "title": "Panchayat XV Finance Commission Tied Grants Allocation",
            "category": "regulations",
            "department": "Panchayati Raj Department",
            "content": "50% of the XV Finance Commission grant is tied for basic services including drinking water supply, rainwater harvesting, water recycling, sanitation, and maintenance of Open Defecation Free (ODF) status. Reallocation across untied funds requires Gram Sabha approval and District Collector concurrence.",
            "summary": "Rules on 50% tied grants for water & sanitation infrastructure with District Collector oversight.",
            "role_visibility": "admin"
        },
        {
            "title": "Citizen Grievance Redressal and SLA Escalation Policy",
            "category": "faqs",
            "department": "Public Grievance Directorate",
            "content": "Citizens can register grievances via Voice, Photo, or Text. If a high-severity critical water or electricity complaint is not assigned within 24 hours or resolved within 72 hours, it automatically escalates to the District Collector Command Center with SLA breach alerts.",
            "summary": "Citizen guide on reporting infrastructure failures and automatic SLA escalation.",
            "role_visibility": "citizen"
        },
        {
            "title": "Technician Safety SOP: Submersible Pump Coils and High-Voltage Switchgear",
            "category": "sops",
            "department": "Rural Electrification Authority",
            "content": "Technicians must ensure 3-phase isolation and lock-out tag-out (LOTO) prior to rewinding submersible motor coils or servicing 415V distribution boxes. Insulated gloves and rubber floor mats are mandatory for all field operations.",
            "summary": "Electrical safety SOP for technicians servicing village pumps and streetlights.",
            "role_visibility": "worker"
        }
    ]

    for ka in knowledge_articles_data:
        article = KnowledgeArticle(
            title=ka["title"],
            category=ka["category"],
            department=ka["department"],
            content=ka["content"],
            summary=ka["summary"],
            role_visibility=ka["role_visibility"],
            created_at=now
        )
        db.add(article)

    # 11. Seed MongoDB Dynamic Inspection Record
    try:
        mongo_service.save_inspection_record({
            "incident_id": inc_wtr_1.id,
            "task_id": 1,
            "asset_id": pump_17.id,
            "inspector_name": "Suresh Kumar",
            "service_type": "water",
            "observations": {
                "motor_temperature_celsius": 68.5,
                "valve_corrosion_level": "moderate",
                "water_pressure_bar": 2.4
            },
            "measurements": {
                "flow_rate_lph": 1200,
                "voltage_phase_to_phase": 412
            },
            "dynamic_fields": {
                "soil_moisture_surrounding": "dry",
                "water_color": "clear",
                "odour_detected": False
            },
            "recommendations": "Recommend quarterly greasing of bearing assembly and installation of surge protector.",
            "risk_level": "low",
            "created_at": now.isoformat()
        })
    except Exception as e:
        print(f"Note on mongo seed: {e}")

    db.commit()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    db = SessionLocal()
    seed_database(db)
    db.close()

