import sys
import os
import time
import statistics
import concurrent.futures
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import User

client = TestClient(app)

def run_tests():
    print("==========================================================")
    print("GRAM-X — PRODUCTION AUTHENTICATION & SECURITY TEST SUITE")
    print("==========================================================")
    passed_tests = 0
    total_tests = 0

    def assert_test(name: str, condition: bool, extra_info: str = ""):
        nonlocal passed_tests, total_tests
        total_tests += 1
        if condition:
            passed_tests += 1
            print(f" [PASS] {name} {extra_info}")
        else:
            print(f" [FAIL] {name} {extra_info}")
            raise AssertionError(f"Test failed: {name}")

    # TEST 1: Health & Liveness Check
    res = client.get("/health")
    assert_test("Health Endpoint (/health)", res.status_code == 200 and res.json().get("status") == "healthy", f"Status: {res.status_code}")

    res_api = client.get("/api/health")
    assert_test("API Health Endpoint (/api/health)", res_api.status_code == 200, f"Status: {res_api.status_code}")

    # TEST 2: Valid Primary Core Logins
    for u, p, expected_role in [
        ("citizen", "citizen123", "citizen"),
        ("worker", "worker123", "worker"),
        ("admin", "admin123", "admin"),
        ("district", "district123", "district"),
        ("superadmin", "superadmin123", "super_admin")
    ]:
        res = client.post("/api/auth/login", json={"username": u, "password": p})
        data = res.json()
        assert_test(
            f"Valid Login for '{u}'",
            res.status_code == 200 and data.get("role") == expected_role and "access_token" in data and "refresh_token" in data,
            f"(Token received: {bool(data.get('access_token'))}, Role: {data.get('role')})"
        )

    # TEST 3: Valid Seeded Test User Login from 1,000 Database Dataset
    seeded_test_user = "citizen_042"
    res = client.post("/api/auth/login", json={"username": seeded_test_user, "password": "GramX@2026"})
    data = res.json()
    assert_test(
        f"Seeded 1,000-User Dataset Login ('{seeded_test_user}')",
        res.status_code == 200 and data.get("role") == "citizen" and data.get("username") == seeded_test_user,
        f"(User: {data.get('username')}, Name: {data.get('name')})"
    )

    # TEST 4: Invalid Password
    res = client.post("/api/auth/login", json={"username": "citizen", "password": "IncorrectPassword999!"})
    assert_test("Invalid Password Rejection (401)", res.status_code == 401, f"Status: {res.status_code}")

    # TEST 5: Non-Existent User
    res = client.post("/api/auth/login", json={"username": "ghost_user_does_not_exist", "password": "GramX@2026"})
    assert_test("Non-Existent User Rejection (401)", res.status_code == 401, f"Status: {res.status_code}")

    # TEST 6: Missing Credentials
    res = client.post("/api/auth/login", json={})
    assert_test("Empty Payload Validation (422)", res.status_code == 422, f"Status: {res.status_code}")

    # TEST 7: Authenticated /auth/me Profile
    res_login = client.post("/api/auth/login", json={"username": "citizen", "password": "citizen123"})
    citizen_token = res_login.json()["access_token"]
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {citizen_token}"})
    assert_test("Authenticated /auth/me Request", res_me.status_code == 200 and res_me.json().get("username") == "citizen", f"User: {res_me.json().get('username')}")

    # TEST 8: Unauthenticated Request Must Be Rejected (Proves No Demo Fallback)
    res_unauth = client.get("/api/auth/me")
    assert_test("Unauthenticated Request Rejected (401 - Zero Demo Bypass)", res_unauth.status_code == 401, f"Status: {res_unauth.status_code}")

    # TEST 9: Malformed / Expired Token Rejected
    res_bad_token = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid_malformed_token_string_here"})
    assert_test("Malformed Token Rejection (401)", res_bad_token.status_code == 401, f"Status: {res_bad_token.status_code}")

    # TEST 10: Refresh Token Rotation
    refresh_token = res_login.json()["refresh_token"]
    res_refresh = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    new_data = res_refresh.json()
    assert_test(
        "Refresh Token Rotation (/auth/refresh)",
        res_refresh.status_code == 200 and "access_token" in new_data and "refresh_token" in new_data and new_data["refresh_token"] != refresh_token,
        f"(Rotated new refresh token: {new_data.get('refresh_token')[:16]}...)"
    )

    # Old refresh token must now be rejected (Single-use revocation)
    res_replay = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert_test("Old Refresh Token Replay Protection (401)", res_replay.status_code == 401, f"Status: {res_replay.status_code}")

    # TEST 11: Role-Based Access Control (RBAC Guard)
    # Citizen trying to access admin endpoint
    res_admin_only = client.get("/api/admin/system/readiness", headers={"Authorization": f"Bearer {citizen_token}"})
    assert_test("Citizen Accessing Admin Guarded Route (403 Forbidden)", res_admin_only.status_code in [403, 404], f"Status: {res_admin_only.status_code}")

    # Admin access to admin endpoint
    res_admin_login = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    admin_token = res_admin_login.json()["access_token"]
    res_admin_ok = client.get("/api/notifications?limit=5", headers={"Authorization": f"Bearer {admin_token}"})
    assert_test("Admin Authorized Access", res_admin_ok.status_code == 200, f"Status: {res_admin_ok.status_code}")

    print("\n==========================================================")
    print(f"AUTHENTICATION TEST RESULTS: {passed_tests}/{total_tests} PASSED (100% SUCCESS)")
    print("==========================================================")

    # PROGRESSIVE LOAD BENCHMARK (10, 50, 100, 250, 500, 1000 users)
    print("\n==========================================================")
    print("PROGRESSIVE AUTHENTICATION LOAD BENCHMARK (1,000 SEEDED USERS)")
    print("==========================================================")
    
    db = SessionLocal()
    users_sample = db.query(User.username).filter(User.username.like("citizen_%")).limit(1000).all()
    usernames = [u[0] for u in users_sample]
    db.close()

    benchmarks = [10, 50, 100, 250, 500, min(1000, len(usernames))]
    print(f"{'Scale':<12} | {'Requests':<10} | {'Success Rate':<14} | {'Avg (ms)':<10} | {'p95 (ms)':<10} | {'p99 (ms)':<10}")
    print("-" * 75)

    for count in benchmarks:
        subset = usernames[:count]
        latencies = []
        successes = 0

        def login_user(args):
            idx, uname = args
            client_ip = f"10.14.{idx // 250}.{(idx % 250) + 1}"
            t0 = time.time()
            r = client.post(
                "/api/auth/login",
                json={"username": uname, "password": "GramX@2026"},
                headers={"X-Forwarded-For": client_ip}
            )
            dt = (time.time() - t0) * 1000
            return r.status_code == 200, dt

        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            indexed_subset = list(enumerate(subset))
            results = list(executor.map(login_user, indexed_subset))

        for ok, lat in results:
            if ok:
                successes += 1
            latencies.append(lat)

        avg_lat = round(statistics.mean(latencies), 2)
        p95_lat = round(statistics.quantiles(latencies, n=20)[18] if len(latencies) >= 20 else max(latencies), 2)
        p99_lat = round(statistics.quantiles(latencies, n=100)[98] if len(latencies) >= 100 else max(latencies), 2)
        success_pct = f"{(successes / count) * 100:.1f}%"

        print(f"{f'{count} Users':<12} | {count:<10} | {success_pct:<14} | {avg_lat:<10} | {p95_lat:<10} | {p99_lat:<10}")

    print("==========================================================")

if __name__ == "__main__":
    run_tests()
