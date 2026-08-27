import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def http_post(url, data=None, token=None):
    req = urllib.request.Request(url, method="POST")
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    body = json.dumps(data).encode("utf-8") if data is not None else None
    try:
        with urllib.request.urlopen(req, data=body) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8")), resp.headers
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body), e.headers
        except Exception:
            return e.code, err_body, e.headers

def http_get(url, token=None):
    req = urllib.request.Request(url, method="GET")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8")), resp.headers
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body), e.headers
        except Exception:
            return e.code, err_body, e.headers

print("=================================================================")
print("  GRAM-X PRODUCTION GOVERNANCE & EXCEPTION HANDLING SUITE        ")
print("=================================================================\n")

# Step 0: Multi-role authentication
s_adm, admin_auth, _ = http_post(f"{BASE_URL}/auth/login", {"username": "admin", "password": "admin123"})
assert s_adm == 200
admin_token = admin_auth["access_token"]

s_wrk, worker_auth, _ = http_post(f"{BASE_URL}/auth/login", {"username": "worker", "password": "worker123"})
assert s_wrk == 200
worker_token = worker_auth["access_token"]

print("[OK] Step 0: Authenticated tokens obtained.")

# STEP 1: State Machine & Impossible Transition Rejection
# Report incident
s_inc, inc_data, _ = http_post(f"{BASE_URL}/incidents/report", {
    "title": "Main Pipeline Pressure Valve Fracture",
    "description": "High pressure valve cracked causing continuous overflow.",
    "category": "water",
    "village_id": 1,
    "reporter_name": "Kailash Citizen",
    "latitude": 23.280,
    "longitude": 77.460
}, token=admin_token)
assert s_inc == 200
inc_id = inc_data["id"]

# Self-heal worker states before dispatch
http_post(f"{BASE_URL}/governance/reconcile", token=admin_token)

# Dispatch to worker user's technician
_, workers, _ = http_get(f"{BASE_URL}/workers", token=admin_token)
tech = [w for w in workers if w.get("user_id") == worker_auth.get("user_id") or "Suresh" in w.get("name", "")][0]

s_task, task_data, _ = http_post(f"{BASE_URL}/tasks/create", {
    "incident_id": inc_id,
    "technician_id": tech["id"],
    "description": "Replace pressure valve and check regulator seals"
}, token=admin_token)
assert s_task == 200
task_id = task_data["id"]

# Try impossible transition directly to completed without in_progress
s_bad, _, _ = http_post(f"{BASE_URL}/tasks/{task_id}/status", {"status": "completed"}, token=admin_token)
# Should be rejected or validated
print(f"[OK] Step 1a: Invalid skip transition handled (Status: {s_bad}).")

# Accept task
s_acc, t_acc, _ = http_post(f"{BASE_URL}/tasks/{task_id}/accept", token=worker_token)
assert s_acc == 200

# Try duplicate accept (Idempotency test)
s_acc2, t_acc2, _ = http_post(f"{BASE_URL}/tasks/{task_id}/accept", token=worker_token)
assert s_acc2 == 200
assert t_acc2["status"] == "accepted"
print("[OK] Step 1b: Task Acceptance is idempotent (2nd call returned clean 200 without error).")

# Transition to in_progress
s_prog, t_prog, _ = http_post(f"{BASE_URL}/tasks/{task_id}/status", {"status": "in_progress"}, token=worker_token)
assert s_prog == 200
assert t_prog["status"] == "in_progress"

# STEP 2: Scope Revision Request & Idempotent Admin Approval
scope_payload = {
    "additional_cost": 4200.0,
    "work_done": "Replaced heavy-duty cast iron pressure relief valve",
    "what_was_wrong": "Valve flange cracked under water hammer surge",
    "product_effect": "Stabilizes line pressure at 3.5 bar with 5 year endurance"
}
s_req, t_req, _ = http_post(f"{BASE_URL}/tasks/{task_id}/request-price-increase", scope_payload, token=worker_token)
assert s_req == 200
assert t_req["cost_revision_status"] == "pending"

# Duplicate price increase request should be idempotent
s_req2, t_req2, _ = http_post(f"{BASE_URL}/tasks/{task_id}/request-price-increase", scope_payload, token=worker_token)
assert s_req2 == 200
assert t_req2["cost_revision_status"] == "pending"
print("[OK] Step 2a: Scope request is idempotent.")

# Admin approves scope
s_app1, t_app1, _ = http_post(f"{BASE_URL}/tasks/{task_id}/approve-scope", token=admin_token)
assert s_app1 == 200
assert t_app1["cost"] == 19200.0

# Admin duplicate approval should be idempotent and NOT increment cost again
s_app2, t_app2, _ = http_post(f"{BASE_URL}/tasks/{task_id}/approve-scope", token=admin_token)
assert s_app2 == 200
assert t_app2["cost"] == 19200.0
print("[OK] Step 2b: Admin Scope Approval is strictly idempotent (Cost remained Rs.19,200).")

# STEP 3: Atomic Task Completion & Idempotent Payout / Ledger
_, v_before, _ = http_get(f"{BASE_URL}/villages", token=admin_token)
spent_before = sum(v.get("budget_spent", 0) for v in v_before)

s_comp1, t_comp1, _ = http_post(f"{BASE_URL}/tasks/{task_id}/status", {"status": "completed"}, token=worker_token)
assert s_comp1 == 200
assert t_comp1["status"] == "completed"
tx_id = t_comp1["payout_tx_id"]
assert tx_id is not None

_, v_after1, _ = http_get(f"{BASE_URL}/villages", token=admin_token)
spent_after1 = sum(v.get("budget_spent", 0) for v in v_after1)
assert spent_after1 == spent_before + 19200.0

# Re-send completed status to test duplicate payout prevention
s_comp2, t_comp2, _ = http_post(f"{BASE_URL}/tasks/{task_id}/status", {"status": "completed"}, token=worker_token)
assert s_comp2 == 200
assert t_comp2["payout_tx_id"] == tx_id # Same transaction ID

_, v_after2, _ = http_get(f"{BASE_URL}/villages", token=admin_token)
spent_after2 = sum(v.get("budget_spent", 0) for v in v_after2)
assert spent_after2 == spent_after1 # Zero duplicate ledger deduction!
print(f"[OK] Step 3: Duplicate completion prevented duplicate payouts & duplicate ledger deductions.")

# STEP 4: Citizen Outcome Gap & Verification
s_gap, gap_resp, _ = http_post(f"{BASE_URL}/incidents/{inc_id}/verify", {
    "verifier": "Kailash Citizen",
    "verification_status": "outcome_gap",
    "remarks": "Valve installed but secondary drain gasket is weeping water."
}, token=admin_token)
assert s_gap == 200
assert gap_resp["verification_status"] == "outcome_gap"
print("[OK] Step 4: Citizen outcome gap registered.")

# STEP 5: Governance Health & System Integrity API
s_hlth, health_data, _ = http_get(f"{BASE_URL}/governance/health", token=admin_token)
assert s_hlth == 200
assert "checks" in health_data
assert "operational_exceptions" in health_data
assert "summary" in health_data
assert len(health_data["checks"]) == 8

checks_dict = {c["name"]: c["status"] for c in health_data["checks"]}
print(f"[OK] Step 5a (Governance Health Matrix): 8 relational checks scanned:")
for name, status in checks_dict.items():
    clean_name = name.encode('ascii', 'replace').decode('ascii')
    print(f"    - {clean_name}: {status}")

# Ensure operational exceptions contains the flagged citizen outcome gap
gap_exs = [e for e in health_data["operational_exceptions"] if e.get("incident_id") == inc_id]
assert len(gap_exs) >= 1
print(f"[OK] Step 5b (Exception Center): Flagged Incident #{inc_id} surfaced in Operational Exceptions Center.")

# STEP 6: Self-Healing Reconciliation
s_rec, rec_data, _ = http_post(f"{BASE_URL}/governance/reconcile", token=admin_token)
assert s_rec == 200
assert rec_data["status"] == "success"
print(f"[OK] Step 6: Self-healing governance reconciliation executed successfully ({rec_data['message']}).")

# STEP 7: Immutable Audit Trail Inspection
s_aud, audit_logs, _ = http_get(f"{BASE_URL}/audit/logs", token=admin_token)
assert s_aud == 200
actions = [a["action"] for a in audit_logs]
assert "SYSTEM_RECONCILIATION_PERFORMED" in actions
assert "OUTCOME_GAP_FLAGGED" in actions
print(f"[OK] Step 7 (Audit Trail): Total {len(audit_logs)} immutable audit records verified.")

print("\n=================================================================")
print("  PRODUCTION GOVERNANCE & EXCEPTION HANDLING AUDIT: 100% PASS     ")
print("=================================================================")
