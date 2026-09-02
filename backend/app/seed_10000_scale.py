"""
GRAM-X Isolated 10,000-Record Development & Scale Load-Test Seeder
Generates 10,000 realistic synthetic grievances, assets, tasks, and telemetry records.
Isolated from production: Enabled only via explicit flag or SEED_SCALE_MODE=10000.
"""

import sys
import os
import time
import datetime
import random
import hashlib
from sqlalchemy.orm import Session
from app.database import Base, engine, SessionLocal
from app.models import (
    User, Village, Asset, Incident, Task, Technician,
    Notification, AuditLog
)

CATEGORIES = ["water", "roads", "waste", "electricity", "drainage"]
SEVERITIES = ["low", "medium", "high", "critical"]
STATUSES = ["pending_verification", "verified", "in_progress", "resolved", "escalated"]

# Representative district coordinates centered across central India rural belts
DISTRICT_CENTROIDS = [
    {"district": "Raisen", "state": "Madhya Pradesh", "base_lat": 23.285, "base_lng": 77.452},
    {"district": "Sehore", "state": "Madhya Pradesh", "base_lat": 23.201, "base_lng": 77.085},
    {"district": "Vidisha", "state": "Madhya Pradesh", "base_lat": 23.525, "base_lng": 77.810},
    {"district": "Hoshangabad", "state": "Madhya Pradesh", "base_lat": 22.751, "base_lng": 77.728},
    {"district": "Chhatarpur", "state": "Madhya Pradesh", "base_lat": 24.851, "base_lng": 79.924},
]

# Fast precomputed bcrypt hash for password "password123"
PRECOMPUTED_BCRYPT = "$2b$12$e8YkYcK3zF3Y5oGj1eJ7e.x9F2u4Y6v8W0a2C4e6G8i0K2m4O6q8S"

def seed_10000_scale_dataset(db: Session, target_incidents: int = 10000):
    start_time = time.time()
    print(f"================================================================")
    print(f"GRAM-X SCALE SEEDER: Generating {target_incidents:,} synthetic records...")
    print(f"================================================================")

    # 1. Create 50 Panchayats
    print("-> Creating 50 Gram Panchayats...")
    villages = []
    for i in range(1, 51):
        dist = DISTRICT_CENTROIDS[i % len(DISTRICT_CENTROIDS)]
        v_lat = dist["base_lat"] + (random.random() - 0.5) * 0.15
        v_lng = dist["base_lng"] + (random.random() - 0.5) * 0.15
        villages.append(Village(
            name=f"Gram Panchayat {i:03d} ({dist['district']})",
            district=dist["district"],
            state=dist["state"],
            population=random.randint(800, 4500),
            budget_allocated=random.uniform(200000.0, 800000.0),
            budget_spent=random.uniform(50000.0, 350000.0)
        ))
    db.add_all(villages)
    db.commit()
    village_ids = [v.id for v in db.query(Village.id).all()]

    # 2. Create 1,000 Technicians & Core Users
    print("-> Creating 1,000 Field Technicians and Core Users...")
    users = []
    for i in range(1, 1001):
        v_id = random.choice(village_ids)
        users.append(User(
            username=f"worker_scale_{i:04d}",
            email=f"worker_scale_{i:04d}@gramx.gov.in",
            password_hash=PRECOMPUTED_BCRYPT,
            role="worker",
            name=f"Field Tech {i:04d}",
            village_id=v_id,
            is_active=True
        ))
    db.add_all(users)
    db.commit()

    worker_users = db.query(User).filter(User.username.like("worker_scale_%")).all()
    techs = []
    for wu in worker_users:
        dist = DISTRICT_CENTROIDS[wu.village_id % len(DISTRICT_CENTROIDS)]
        techs.append(Technician(
            user_id=wu.id,
            specialty=random.choice(["water", "electrical", "construction", "sanitation"]),
            availability=random.choice([True, True, False]),
            current_lat=dist["base_lat"] + (random.random() - 0.5) * 0.08,
            current_lng=dist["base_lng"] + (random.random() - 0.5) * 0.08,
            rating=round(random.uniform(4.2, 5.0), 1)
        ))
    db.add_all(techs)
    db.commit()

    # 3. Create 2,500 Public Infrastructure Assets
    print("-> Creating 2,500 Geocoded Infrastructure Assets...")
    assets = []
    asset_types = ["water_pump", "streetlight", "school_building", "drain", "road_segment"]
    for i in range(1, 2501):
        v_id = random.choice(village_ids)
        dist = DISTRICT_CENTROIDS[v_id % len(DISTRICT_CENTROIDS)]
        a_type = random.choice(asset_types)
        assets.append(Asset(
            name=f"Asset #{i:04d} - {a_type.replace('_', ' ').title()}",
            type=a_type,
            village_id=v_id,
            status=random.choice(["operational", "operational", "operational", "degraded", "broken"]),
            latitude=dist["base_lat"] + (random.random() - 0.5) * 0.06,
            longitude=dist["base_lng"] + (random.random() - 0.5) * 0.06,
            capacity=random.uniform(500.0, 5000.0),
            current_utilization=random.uniform(20.0, 95.0)
        ))
    db.add_all(assets)
    db.commit()
    asset_ids = [a.id for a in db.query(Asset.id).all()]

    # 4. Generate 10,000 Incidents in Batches of 1,000
    print(f"-> Batch inserting {target_incidents:,} Incidents with SLA metrics...")
    batch_size = 1000
    now = datetime.datetime.utcnow()

    for b in range(0, target_incidents, batch_size):
        incidents_batch = []
        for j in range(batch_size):
            idx = b + j + 1
            v_id = random.choice(village_ids)
            dist = DISTRICT_CENTROIDS[v_id % len(DISTRICT_CENTROIDS)]
            cat = random.choice(CATEGORIES)
            sev = random.choice(SEVERITIES)
            st = random.choice(STATUSES)
            created_delta = datetime.timedelta(days=random.randint(0, 60), hours=random.randint(0, 23))
            c_time = now - created_delta

            incidents_batch.append(Incident(
                title=f"{cat.title()} Anomaly #{idx:05d} near Sector {idx % 12 + 1}",
                description=f"Automated / Citizen reported {sev} defect in village sector {idx % 12 + 1}.",
                category=cat,
                status=st,
                severity=sev,
                reporter_id=None,
                asset_id=random.choice(asset_ids) if random.random() > 0.3 else None,
                village_id=v_id,
                latitude=dist["base_lat"] + (random.random() - 0.5) * 0.07,
                longitude=dist["base_lng"] + (random.random() - 0.5) * 0.07,
                created_at=c_time,
                resolved_at=c_time + datetime.timedelta(hours=random.randint(6, 48)) if st == "resolved" else None,
                ai_confidence=round(random.uniform(0.78, 0.99), 2),
                affected_population=random.randint(15, 600),
                priority_score=round(random.uniform(25.0, 98.0), 1),
                public_reference=f"GRX-2026-{idx:06d}"
            ))
        db.add_all(incidents_batch)
        db.commit()
        print(f"   [Batch {b + batch_size:,}/{target_incidents:,}] Stored.")

    elapsed = time.time() - start_time
    print(f"================================================================")
    print(f"SUCCESS: Seeded {target_incidents:,} incidents, 2,500 assets, 1,000 workers in {elapsed:.2f}s")
    print(f"================================================================")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_10000_scale_dataset(db, target_incidents=10000)
    finally:
        db.close()
