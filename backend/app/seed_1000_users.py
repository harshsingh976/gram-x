import datetime
import random
import json
import bcrypt
import time
from sqlalchemy.orm import Session
from app.database import Base, engine, SessionLocal
from app.models import (
    User, Village, Asset, Household, SensorReading, 
    Incident, IncidentEvidence, Project, ProjectMilestone, 
    ProjectOutcome, Technician, Task, MaintenanceHistory,
    VerificationRecord, AuditLog, KnowledgeArticle, IncidentFeedback
)

FIRST_NAMES = [
    "Aarav", "Aditi", "Amit", "Ananya", "Anil", "Anita", "Anjali", "Arjun", "Ashok", "Bhavna",
    "Chetan", "Deepak", "Devi", "Divya", "Ganesh", "Geeta", "Gopal", "Harish", "Hemant", "Indira",
    "Jagdish", "Jyoti", "Kailash", "Kamla", "Karan", "Kavita", "Kishore", "Laxmi", "Madhav", "Manish",
    "Meena", "Mohan", "Mukesh", "Nandini", "Naresh", "Neha", "Nirmala", "Omkar", "Pankaj", "Pooja",
    "Pradeep", "Prakash", "Pramila", "Pravin", "Preeti", "Radha", "Rahul", "Rajendra", "Rajesh", "Rakesh",
    "Ram", "Ramesh", "Rekha", "Ritu", "Rohit", "Rupa", "Sachin", "Sangita", "Santosh", "Sarita",
    "Satish", "Seema", "Shankar", "Shanti", "Shashi", "Shiv", "Shobha", "Shyam", "Sneha", "Subhash",
    "Sudhir", "Suman", "Sunil", "Sunita", "Suresh", "Sushila", "Tarun", "Usha", "Varun", "Vikas",
    "Vinod", "Virendra", "Yash", "Yogesh"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Singh", "Yadav", "Kumar", "Chouhan", "Mishra", "Gupta", "Joshi",
    "Tiwari", "Pandey", "Rajput", "Rathore", "Meena", "Lodhi", "Sen", "Bhopali", "Malviya", "Dubey"
]

SPECIALTIES = ["water", "electrical", "construction", "sanitation", "roads"]

def generate_full_name(seed_idx: int) -> str:
    random.seed(seed_idx)
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

def seed_1000_database(db: Session = None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    start_time = time.time()
    print("==========================================================")
    print("GRAM-X — DETERMINISTIC SEEDING (1,000+ USERS & GOVERNANCE)")
    print("==========================================================")

    # 1. Clean drop and create
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    import app.models as models_mod
    models_mod._last_audit_hash = None

    # 2. Precompute bcrypt hashes for ultra-fast, deterministic seeding
    print("Pre-computing cryptographic password hashes...")
    hash_admin = bcrypt.hashpw(b"admin123", bcrypt.gensalt(10)).decode("utf-8")
    hash_citizen = bcrypt.hashpw(b"citizen123", bcrypt.gensalt(10)).decode("utf-8")
    hash_worker = bcrypt.hashpw(b"worker123", bcrypt.gensalt(10)).decode("utf-8")
    hash_district = bcrypt.hashpw(b"district123", bcrypt.gensalt(10)).decode("utf-8")
    hash_superadmin = bcrypt.hashpw(b"superadmin123", bcrypt.gensalt(10)).decode("utf-8")
    hash_test_user = bcrypt.hashpw(b"GramX@2026", bcrypt.gensalt(10)).decode("utf-8")

    # 3. Create 5 Gram Panchayats / Villages in Raisen & Chhatarpur clusters
    print("Creating Gram Panchayat clusters...")
    villages_data = [
        {"name": "Piparli", "district": "Raisen", "state": "Madhya Pradesh", "population": 1450, "budget_allocated": 350000.0, "budget_spent": 185000.0, "lat": 23.285, "lng": 77.452},
        {"name": "Ramnagar", "district": "Raisen", "state": "Madhya Pradesh", "population": 920, "budget_allocated": 220000.0, "budget_spent": 95000.0, "lat": 23.298, "lng": 77.475},
        {"name": "Haripura", "district": "Raisen", "state": "Madhya Pradesh", "population": 1680, "budget_allocated": 410000.0, "budget_spent": 240000.0, "lat": 23.262, "lng": 77.421},
        {"name": "Madanpur", "district": "Raisen", "state": "Madhya Pradesh", "population": 1100, "budget_allocated": 190000.0, "budget_spent": 80000.0, "lat": 23.310, "lng": 77.435},
        {"name": "Khajuraho Rural", "district": "Chhatarpur", "state": "Madhya Pradesh", "population": 2400, "budget_allocated": 520000.0, "budget_spent": 340000.0, "lat": 24.851, "lng": 79.924}
    ]

    villages = []
    for vd in villages_data:
        lat, lng = vd["lat"], vd["lng"]
        d = 0.015
        geojson = {
            "type": "Feature",
            "properties": {"name": vd["name"]},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[lng - d, lat - d], [lng + d, lat - d], [lng + d, lat + d], [lng - d, lat + d], [lng - d, lat - d]]]
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
    for v in villages:
        db.refresh(v)

    # 4. Core Development Accounts
    print("Creating core primary accounts...")
    core_users = [
        User(username="admin", email="admin@gramx.gov.in", name="Rajesh Kumar (Panchayat Sec.)", role="admin", password_hash=hash_admin, village_id=villages[0].id, is_active=True),
        User(username="citizen", email="citizen@gramx.gov.in", name="Sunita Devi (Citizen)", role="citizen", password_hash=hash_citizen, village_id=villages[0].id, is_active=True),
        User(username="worker", email="worker@gramx.gov.in", name="Suresh Kumar (Lead Technician)", role="worker", password_hash=hash_worker, village_id=villages[0].id, is_active=True),
        User(username="district", email="collector@gramx.gov.in", name="District Collector Raisen", role="district", password_hash=hash_district, village_id=None, is_active=True),
        User(username="superadmin", email="superadmin@gramx.gov.in", name="State Governance Oversight", role="super_admin", password_hash=hash_superadmin, village_id=None, is_active=True)
    ]
    db.add_all(core_users)
    db.commit()
    for u in core_users:
        db.refresh(u)

    # Core worker technician profile
    core_worker_tech = Technician(
        user_id=core_users[2].id,
        specialty="water",
        availability=True,
        current_lat=23.285,
        current_lng=77.452,
        rating=4.9
    )
    db.add(core_worker_tech)
    db.commit()
    db.refresh(core_worker_tech)

    # 5. Generate 1,000 Deterministic Test Users
    print("Generating 1,000 test users...")
    all_users = []
    technicians = [core_worker_tech]

    # A. 700 Citizens
    for i in range(1, 701):
        v_idx = (i - 1) % len(villages)
        u_name = generate_full_name(i * 13)
        user = User(
            username=f"citizen_{i:03d}",
            email=f"citizen_{i:03d}@gramx.test",
            name=u_name,
            role="citizen",
            password_hash=hash_test_user,
            village_id=villages[v_idx].id,
            is_active=True,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 180))
        )
        all_users.append(user)

    # B. 200 Field Workers / Technicians
    worker_user_objs = []
    for i in range(1, 201):
        v_idx = (i - 1) % len(villages)
        u_name = generate_full_name(i * 37 + 5000)
        spec = SPECIALTIES[(i - 1) % len(SPECIALTIES)]
        user = User(
            username=f"worker_{i:03d}",
            email=f"worker_{i:03d}@gramx.test",
            name=f"{u_name} ({spec.capitalize()} Tech)",
            role="worker",
            password_hash=hash_test_user,
            village_id=villages[v_idx].id,
            is_active=True,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 180))
        )
        all_users.append(user)
        worker_user_objs.append((user, spec, villages[v_idx]))

    # C. 90 Sarpanch / Panchayat Admins
    for i in range(1, 91):
        v_idx = (i - 1) % len(villages)
        u_name = generate_full_name(i * 71 + 9000)
        user = User(
            username=f"sarpanch_{i:03d}",
            email=f"sarpanch_{i:03d}@gramx.test",
            name=f"{u_name} (Gram Sarpanch)",
            role="admin",
            password_hash=hash_test_user,
            village_id=villages[v_idx].id,
            is_active=True,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 180))
        )
        all_users.append(user)

    # D. 10 District Oversight Officers
    for i in range(1, 11):
        u_name = generate_full_name(i * 97 + 15000)
        user = User(
            username=f"district_{i:03d}",
            email=f"district_{i:03d}@gramx.test",
            name=f"{u_name} (District Oversight Officer)",
            role="district",
            password_hash=hash_test_user,
            village_id=None,
            is_active=True,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 180))
        )
        all_users.append(user)

    # Bulk insert users in batches of 250 for speed
    print("Bulk inserting 1,000 user records...")
    db.bulk_save_objects(all_users)
    db.commit()

    # Re-query workers to attach Technician profiles
    print("Linking worker technician operational profiles...")
    inserted_workers = db.query(User).filter(User.username.like("worker_%")).all()
    tech_objs = []
    for w in inserted_workers:
        spec = SPECIALTIES[w.id % len(SPECIALTIES)]
        v_idx = w.id % len(villages)
        v = villages[v_idx]
        t = Technician(
            user_id=w.id,
            specialty=spec,
            availability=True,
            current_lat=v.lat if hasattr(v, "lat") else 23.285 + random.uniform(-0.02, 0.02),
            current_lng=v.lng if hasattr(v, "lng") else 77.452 + random.uniform(-0.02, 0.02),
            rating=round(random.uniform(4.2, 5.0), 1)
        )
        tech_objs.append(t)
    db.bulk_save_objects(tech_objs)
    db.commit()

    # 6. Create Village Assets
    print("Populating infrastructure assets...")
    assets = []
    asset_types = [
        ("Solar Submersible Pump #1", "water_pump", "operational", 0.002, 0.003, 12000.0, 68.0),
        ("Ward 4 Community Handpump", "water_pump", "degraded", -0.003, 0.004, 3000.0, 90.0),
        ("Main Market LED Streetlight Grid", "streetlight", "operational", 0.001, -0.002, 4.5, 100.0),
        ("Primary Health Center Drain Line", "drain", "operational", -0.004, -0.003, None, 45.0),
        ("Panchayat Bhawan Rooftop Solar", "streetlight", "operational", 0.000, 0.000, 10.0, 80.0),
        ("East Sector Rural Link Road", "road_segment", "degraded", 0.005, 0.006, None, 85.0)
    ]
    for v in villages:
        v_lat = 23.285 if v.name == "Piparli" else 23.298
        v_lng = 77.452 if v.name == "Piparli" else 77.475
        for a_name, a_type, a_stat, off_lat, off_lng, cap, util in asset_types:
            asset = Asset(
                name=f"{v.name} {a_name}",
                type=a_type,
                village_id=v.id,
                status=a_stat,
                latitude=v_lat + off_lat,
                longitude=v_lng + off_lng,
                install_date=datetime.datetime.utcnow() - datetime.timedelta(days=400),
                capacity=cap,
                current_utilization=util
            )
            assets.append(asset)
            db.add(asset)
    db.commit()
    for a in assets:
        db.refresh(a)

    # 7. Create Incidents, Tasks, Evidence & Tamper-Evident Audit Trails
    print("Creating realistic governance workflows (Incidents, Tasks, Evidence, Audit Chain)...")
    incidents_data = [
        {
            "title": "Low water pressure in Ward B primary tube-well line",
            "desc": "Flow rate dropped by 65% since Thursday. 45 households affected.",
            "cat": "water",
            "status": "in_progress",
            "sev": "high",
            "v_id": villages[0].id,
            "asset_id": assets[0].id,
            "lat": 23.287,
            "lng": 77.455,
            "pop": 240,
            "pri": 88.5,
            "ref": "GRX-2026-0801"
        },
        {
            "title": "Broken handle on Ward 4 Handpump near School",
            "desc": "Lever pin cracked. Children unable to access drinking water.",
            "cat": "water",
            "status": "resolved",
            "sev": "critical",
            "v_id": villages[0].id,
            "asset_id": assets[1].id,
            "lat": 23.282,
            "lng": 77.456,
            "pop": 310,
            "pri": 94.0,
            "ref": "GRX-2026-0802"
        },
        {
            "title": "Streetlight pole short-circuit after rain",
            "desc": "Main junction sparking in wet weather. High electrocution risk.",
            "cat": "electricity",
            "status": "pending_verification",
            "sev": "critical",
            "v_id": villages[0].id,
            "asset_id": assets[2].id,
            "lat": 23.286,
            "lng": 77.450,
            "pop": 120,
            "pri": 91.0,
            "ref": "GRX-2026-0803"
        }
    ]

    for ind in incidents_data:
        inc = Incident(
            title=ind["title"],
            description=ind["desc"],
            category=ind["cat"],
            status=ind["status"],
            severity=ind["sev"],
            village_id=ind["v_id"],
            asset_id=ind["asset_id"],
            reporter_id=core_users[1].id, # citizen
            latitude=ind["lat"],
            longitude=ind["lng"],
            ai_confidence=0.96,
            affected_population=ind["pop"],
            priority_score=ind["pri"],
            public_reference=ind["ref"],
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=3),
            resolved_at=datetime.datetime.utcnow() - datetime.timedelta(hours=6) if ind["status"] == "resolved" else None
        )
        db.add(inc)
        db.commit()
        db.refresh(inc)

        # Task for assigned/resolved incidents
        if ind["status"] in ["in_progress", "resolved"]:
            t = Task(
                incident_id=inc.id,
                technician_id=core_worker_tech.id,
                description=f"Field dispatch for: {inc.title}",
                status="completed" if ind["status"] == "resolved" else "accepted",
                assigned_at=datetime.datetime.utcnow() - datetime.timedelta(days=2),
                completed_at=datetime.datetime.utcnow() - datetime.timedelta(hours=8) if ind["status"] == "resolved" else None,
                cost=14500.0,
                base_cost=15000.0,
                cost_increased=False,
                work_done="Replaced cracked fulcrum pivot pin and lubricated check-valve seals.",
                what_was_wrong="Heavy rust corrosion caused stress fracture on pump lever.",
                product_effect="Full flow rate restored, child safety verified.",
                payout_status="paid" if ind["status"] == "resolved" else "pending",
                payout_tx_id="TXN-PAY-882910" if ind["status"] == "resolved" else None
            )
            db.add(t)
            db.commit()
            db.refresh(t)

            # Evidence upload
            ev = IncidentEvidence(
                incident_id=inc.id,
                task_id=t.id,
                type="photo",
                file_path="/media/evidence_verified_pump.jpg",
                recognized_text="Handpump check valve replaced, operating normally",
                uploaded_by=core_users[2].id, # worker
                quality_grade="GOOD",
                risk_level="LOW",
                review_status="accepted",
                review_remarks="Clear photographic evidence of repair verified by Panchayat."
            )
            db.add(ev)
            db.commit()

            # Citizen Verification Record if resolved
            if ind["status"] == "resolved":
                vr = VerificationRecord(
                    incident_id=inc.id,
                    verifier="Sunita Devi (Citizen Reporter)",
                    verification_status="verified",
                    remarks="Water flow is completely clear and handpump is working smoothly now. Thank you Gram Panchayat!"
                )
                db.add(vr)
                
                fb = IncidentFeedback(
                    incident_id=inc.id,
                    user_id=core_users[1].id,
                    is_resolved=True,
                    rating=5,
                    comment="Repaired within 24 hours of reporting. Excellent turnaround."
                )
                db.add(fb)
                db.commit()

    # 8. Cryptographic Audit Chain Initialization
    print("Establishing tamper-evident SHA-256 Audit Chain...")
    audit_events = [
        ("SYSTEM_BOOT", None, "GRAM-X Production Engine Initialized with 1,000 Seed Users"),
        ("USER_LOGIN", core_users[0].id, "Panchayat Secretary admin logged in"),
        ("GRIEVANCE_REGISTERED", core_users[1].id, "Citizen reported incident GRX-2026-0801"),
        ("AI_TRIAGE_COMPLETE", None, "AI classifier assigned water category with 96% confidence"),
        ("DISPATCH_WORKER", core_users[0].id, "Panchayat dispatched Suresh Kumar to repair handpump"),
        ("EVIDENCE_SUBMITTED", core_users[2].id, "Worker uploaded repair completion photo"),
        ("CITIZEN_VERIFIED", core_users[1].id, "Citizen confirmed successful water flow")
    ]
    for action, uid, details in audit_events:
        al = AuditLog(
            user_id=uid,
            action=action,
            timestamp=datetime.datetime.utcnow() - datetime.timedelta(hours=random.randint(1, 48)),
            details=details
        )
        db.add(al)
        db.commit()

    # 9. Summary and verification
    user_count = db.query(User).count()
    citizen_count = db.query(User).filter(User.role == "citizen").count()
    worker_count = db.query(User).filter(User.role == "worker").count()
    admin_count = db.query(User).filter(User.role == "admin").count()
    district_count = db.query(User).filter(User.role == "district").count()
    village_count = db.query(Village).count()
    asset_count = db.query(Asset).count()
    incident_count = db.query(Incident).count()
    audit_count = db.query(AuditLog).count()

    elapsed = round(time.time() - start_time, 2)
    print("\n==========================================================")
    print(f"SUCCESS: Database seeded in {elapsed} seconds!")
    print(f"Total Users in Database: {user_count}")
    print(f"  - Citizens:   {citizen_count}")
    print(f"  - Workers:    {worker_count}")
    print(f"  - Admins:     {admin_count}")
    print(f"  - District:   {district_count}")
    print(f"Villages:       {village_count}")
    print(f"Assets:         {asset_count}")
    print(f"Incidents:      {incident_count}")
    print(f"Audit Logs:     {audit_count}")
    print("Deterministic test password for test users: GramX@2026")
    print("Core primary passwords: admin123, citizen123, worker123, district123, superadmin123")
    print("==========================================================")

    if close_db:
        db.close()

if __name__ == "__main__":
    seed_1000_database()
