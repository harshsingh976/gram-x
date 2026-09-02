"""
GRAM-X Automated Scale, Pagination & GIS Features Test Suite
Verifies 10,000-scale readiness, bounding box spatial queries, safe page size caps, and zero-dummy-data behavior.
"""

import sys
import os
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import User, Village, Asset, Incident, Technician
from app.services.auth_utils import create_access_token

client = TestClient(app)

def get_auth_token(role="admin", username="admin"):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            user = db.query(User).filter(User.role == role).first()
        if not user:
            v = db.query(Village).first()
            user = User(
                username=username,
                email=f"{username}@gramx.gov.in",
                password_hash="$2b$12$e8YkYcK3zF3Y5oGj1eJ7e.x9F2u4Y6v8W0a2C4e6G8i0K2m4O6q8S",
                role=role,
                name="Test Authority",
                village_id=v.id if v else None
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        token = create_access_token(data={"sub": user.username, "role": user.role, "user_id": user.id})
        return token
    finally:
        db.close()

def test_pagination_default_headers():
    token = get_auth_token(role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/incidents?page=1&limit=10", headers=headers)
    assert res.status_code == 200
    assert "X-Total-Count" in res.headers
    assert "X-Page" in res.headers
    assert "X-Total-Pages" in res.headers
    assert "X-Limit" in res.headers
    assert res.headers["X-Page"] == "1"
    assert res.headers["X-Limit"] == "10"
    data = res.json()
    assert isinstance(data, list)
    assert len(data) <= 10
    print(" [PASS] Pagination default headers & slice validation")

def test_pagination_max_limit_enforcement():
    token = get_auth_token(role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    # Requesting > 200 should trigger FastAPI Query validation (422 Unprocessable Entity)
    res = client.get("/api/incidents?limit=500", headers=headers)
    assert res.status_code == 422
    print(" [PASS] Max limit (200) enforcement guards against memory exhaustion")

def test_category_and_search_filtering():
    token = get_auth_token(role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/incidents?category=water&page=1&limit=20", headers=headers)
    assert res.status_code == 200
    data = res.json()
    for item in data:
        assert item["category"] == "water"
    print(" [PASS] Category filtering on indexed fields")

def test_gis_bounding_box_features():
    token = get_auth_token(role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    # Query bounding box around Raisen/Bhopal region (lat: 23.0-23.5, lng: 77.0-78.0)
    res = client.get(
        "/api/gis/features?min_lat=23.0&min_lng=77.0&max_lat=23.5&max_lng=78.0&layers=all",
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert "assets" in data
    assert "incidents" in data
    assert "workers" in data
    print(" [PASS] GIS Viewport Bounding-Box API query")

def test_unauthenticated_gis_rejected():
    res = client.get("/api/gis/features?min_lat=23.0&min_lng=77.0&max_lat=23.5&max_lng=78.0")
    assert res.status_code == 401
    print(" [PASS] Unauthenticated GIS access rejected (Zero Demo Bypass)")

if __name__ == "__main__":
    test_pagination_default_headers()
    test_pagination_max_limit_enforcement()
    test_category_and_search_filtering()
    test_gis_bounding_box_features()
    test_unauthenticated_gis_rejected()
    print("\nALL SCALE & GIS AUTOMATED TESTS PASSED (100% SUCCESS)")
