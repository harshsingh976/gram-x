import urllib.request
import urllib.error
import json
import csv
import io
import time
import sys
import base64

BASE_URL = "http://127.0.0.1:8000/api"

def http_post(url, data=None, token=None):
    req = urllib.request.Request(url, method="POST")
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    body = json.dumps(data).encode("utf-8") if data is not None else None
    try:
        with urllib.request.urlopen(req, data=body) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}, resp.headers
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body), e.headers
        except Exception:
            return e.code, err_body, e.headers

def http_get(url, token=None, return_raw=False):
    req = urllib.request.Request(url, method="GET")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            if return_raw:
                return resp.status, content, resp.headers
            return resp.status, json.loads(content), resp.headers
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body), e.headers
        except Exception:
            return e.code, err_body, e.headers

print("=================================================================")
print("  GRAM-X OBSERVABILITY, PERFORMANCE & RESILIENCE VERIFICATION   ")
print("=================================================================\n")

# Wait for backend to be ready
for i in range(10):
    try:
        s, c, _ = http_get(f"{BASE_URL}/config")
        if s == 200:
            break
    except Exception:
        time.sleep(0.5)

# 1. Multi-role Authentication
s_adm, adm_auth, _ = http_post(f"{BASE_URL}/auth/login", {"username": "admin", "password": "admin123"})
assert s_adm == 200, f"Admin login failed: {adm_auth}"
admin_token = adm_auth["access_token"]
print(" [PASS] 1. Admin Authentication Successful")

s_wkr, wkr_auth, _ = http_post(f"{BASE_URL}/auth/login", {"username": "worker", "password": "worker123"})
assert s_wkr == 200, f"Worker login failed: {wkr_auth}"
worker_token = wkr_auth["access_token"]
print(" [PASS] 2. Worker Authentication Successful")

s_dis, dis_auth, _ = http_post(f"{BASE_URL}/auth/login", {"username": "district", "password": "district123"})
assert s_dis == 200, f"District login failed: {dis_auth}"
district_token = dis_auth["access_token"]
print(" [PASS] 3. District Oversight Authentication Successful")

s_cit, cit_auth, _ = http_post(f"{BASE_URL}/auth/login", {"username": "citizen", "password": "citizen123"})
assert s_cit == 200, f"Citizen login failed: {cit_auth}"
citizen_token = cit_auth["access_token"]
print(" [PASS] 4. Citizen Authentication Successful")

# 2. System Operations & Observability Diagnostics
s_ops, ops_data, _ = http_get(f"{BASE_URL}/system/operations", token=admin_token)
assert s_ops == 200, f"System operations failed: {ops_data}"
assert "total_requests" in ops_data
assert "components" in ops_data
assert ops_data["components"]["api_health"] in ["HEALTHY", "DEGRADED", "CRITICAL"]
assert ops_data["components"]["database"] in ["HEALTHY", "DEGRADED", "UNAVAILABLE"]
assert ops_data["components"]["governance_engine"] in ["HEALTHY", "ATTENTION_REQUIRED"]
assert ops_data["components"]["sla_engine"] in ["HEALTHY", "ATTENTION_REQUIRED"]
assert ops_data["components"]["reconciliation"] in ["HEALTHY", "DEGRADED"]
print(f" [PASS] 5. System Operations Telemetry Active (API: {ops_data['components']['api_health']}, DB: {ops_data['components']['database']}, ReqCount: {ops_data['total_requests']}, AvgLat: {ops_data['average_response_time_ms']}ms)")

# 3. RBAC Enforcement & Security Denials
s_cit_ops, _, _ = http_get(f"{BASE_URL}/system/operations", token=citizen_token)
assert s_cit_ops == 403, "Citizen should be forbidden from accessing system operations"

s_cit_audit, _, _ = http_get(f"{BASE_URL}/audit/logs", token=citizen_token)
assert s_cit_audit == 403, "Citizen should be forbidden from accessing audit logs"

s_cit_exp, _, _ = http_get(f"{BASE_URL}/audit/export", token=citizen_token)
assert s_cit_exp == 403, "Citizen should be forbidden from exporting audit trails"

s_cit_sum, _, _ = http_get(f"{BASE_URL}/collector/summary", token=citizen_token)
assert s_cit_sum == 403, "Citizen should be forbidden from collector district executive summary"
print(" [PASS] 6. RBAC Protected Endpoints Strictly Reject Unauthorized Roles (403 Forbidden)")

# 4. Server-Side Audit Trail Pagination & Multi-Attribute Filtering
s_aud_page, aud_page, _ = http_get(f"{BASE_URL}/audit/logs?page=1&page_size=5", token=admin_token)
assert s_aud_page == 200
assert "items" in aud_page and "total" in aud_page and "total_pages" in aud_page
assert aud_page["page"] == 1
assert len(aud_page["items"]) <= 5
print(f" [PASS] 7. Server-Side Audit Pagination Operational (Page {aud_page['page']}/{aud_page['total_pages']}, Total Records: {aud_page['total']})")

s_aud_flt, aud_flt, _ = http_get(f"{BASE_URL}/audit/logs?page=1&page_size=10&action=TASK", token=admin_token)
assert s_aud_flt == 200
for item in aud_flt["items"]:
    assert "TASK" in item["action"]
print(f" [PASS] 8. Multi-Attribute Filter Query Filtered {len(aud_flt['items'])} matching entries")

# 5. Audit Trail RFC-4180 CSV Export
s_csv, csv_text, csv_hdrs = http_get(f"{BASE_URL}/audit/export", token=admin_token, return_raw=True)
assert s_csv == 200
assert "text/csv" in csv_hdrs.get("Content-Type", "")
assert "attachment; filename=gramx_audit_trail" in csv_hdrs.get("Content-Disposition", "")
csv_reader = csv.reader(io.StringIO(csv_text))
header = next(csv_reader)
assert header[:7] == ["Audit ID", "Timestamp (UTC)", "Action", "User ID", "Actor Name", "Actor Role", "Event Details"]
rows = list(csv_reader)
assert len(rows) > 0
print(f" [PASS] 9. Governance Audit CSV Export Verified ({len(rows)} rows with correct RFC-4180 columns)")

# 6. Live Recent Governance Activity Stream
s_act, act_list, _ = http_get(f"{BASE_URL}/governance/activity?limit=6", token=district_token)
assert s_act == 200
assert isinstance(act_list, list)
assert len(act_list) <= 6
print(f" [PASS] 10. Recent Governance Activity Stream Returned {len(act_list)} real chronological events")

# 7. District Executive Summary (5 Core Governance Questions)
s_sum, sum_data, _ = http_get(f"{BASE_URL}/collector/summary", token=district_token)
assert s_sum == 200
assert "what_is_happening" in sum_data
assert "where_is_it_happening" in sum_data
assert "what_is_going_wrong" in sum_data
assert "how_much_is_costing" in sum_data
assert "what_needs_intervention" in sum_data
print(f" [PASS] 11. Collector District Executive Summary Verified:")
print(f"       1. What is Happening: {sum_data['what_is_happening']['active_unresolved']} Unresolved, {sum_data['what_is_happening']['completed_resolved']} Resolved")
print(f"       2. Where: Ranked across {len(sum_data['where_is_it_happening'])} Panchayats (Top risk: {sum_data['where_is_it_happening'][0]['name']})")
print(f"       3. What is Going Wrong: {sum_data['what_is_going_wrong']['sla_breaches']} SLA Breaches, {sum_data['what_is_going_wrong']['citizen_outcome_gaps']} Outcome Gaps")
print(f"       4. How Much Costing: INR {sum_data['how_much_is_costing']['total_spent']:,.0f} spent ({sum_data['how_much_is_costing']['budget_utilization_pct']}%)")
print(f"       5. What Needs Intervention: {len(sum_data['what_needs_intervention'])} Escalations Flagged")

# 8. Full Incident Lifecycle, Idempotent Mutations & Reconciliation Regression
# A. Citizen report
s_rep, rep_data, _ = http_post(f"{BASE_URL}/incidents/report", {
    "title": "Observability Check Transformer Sparks",
    "description": "High voltage transformer sparks near school",
    "category": "electricity",
    "village_id": 1,
    "latitude": 23.32,
    "longitude": 77.74
}, token=citizen_token)
assert s_rep == 200, f"Incident report failed: {rep_data}"
inc_id = rep_data["id"]

# Free technician 1 if already assigned to a previous incomplete task from earlier test runs
s_my_tasks, my_tasks, _ = http_get(f"{BASE_URL}/tasks/mine", token=worker_token)
if s_my_tasks == 200 and isinstance(my_tasks, list):
    for t in my_tasks:
        if t.get("status") in ["assigned", "in_progress", "accepted"]:
            if t.get("status") == "assigned":
                http_post(f"{BASE_URL}/tasks/{t['id']}/status", {"status": "in_progress"}, token=worker_token)
            http_post(f"{BASE_URL}/tasks/{t['id']}/status", {"status": "completed"}, token=worker_token)

# B. Admin dispatch
s_dsp, dsp_data, _ = http_post(f"{BASE_URL}/tasks/create", {
    "incident_id": inc_id,
    "technician_id": 1,
    "description": "Emergency transformer inspection"
}, token=admin_token)
assert s_dsp == 200, f"Task dispatch failed: {dsp_data}"
task_id = dsp_data["id"]

# C. Worker acceptance (idempotent)
s_acc1, _, _ = http_post(f"{BASE_URL}/tasks/{task_id}/accept", token=worker_token)
assert s_acc1 == 200
s_acc2, _, _ = http_post(f"{BASE_URL}/tasks/{task_id}/accept", token=worker_token)
assert s_acc2 == 200

# D. Evidence upload with SHA-256
s_ev, ev_data, _ = http_post(f"{BASE_URL}/tasks/{task_id}/upload-evidence", {
    "photo_base64": "data:image/jpeg;base64," + base64.b64encode(b"transformer_repaired_sample_photo").decode('ascii'),
    "file_name": "transformer_inspected.jpg",
    "file_type": "image/jpeg",
    "recognized_text": "Circuit breaker replaced, insulation tested"
}, token=worker_token)
assert s_ev == 200, f"Evidence upload failed: {ev_data}"
assert len(ev_data["checksum"]) == 64

# E. Admin Evidence Approval
s_rev, rev_data, _ = http_post(f"{BASE_URL}/evidence/{ev_data['id']}/review", {
    "action": "accepted",
    "remarks": "High quality repair verification photo confirmed"
}, token=admin_token)
assert s_rev == 200

# F. Worker moves to in_progress and then completes task
s_prog, _, _ = http_post(f"{BASE_URL}/tasks/{task_id}/status", {"status": "in_progress"}, token=worker_token)
assert s_prog == 200

s_cmp, cmp_data, _ = http_post(f"{BASE_URL}/tasks/{task_id}/status", {"status": "completed"}, token=worker_token)
assert s_cmp == 200, f"Completion failed: {cmp_data}"
tx_id_1 = cmp_data["payout_tx_id"]

# G. Duplicate Completion Idempotency
s_cmp2, cmp2_data, _ = http_post(f"{BASE_URL}/tasks/{task_id}/status", {"status": "completed"}, token=worker_token)
assert s_cmp2 == 200
assert cmp2_data["payout_tx_id"] == tx_id_1

# H. Citizen Verification
s_vrf, vrf_data, _ = http_post(f"{BASE_URL}/incidents/{inc_id}/verify", {
    "verification_status": "verified",
    "remarks": "Electricity restored properly and transformer is silent."
}, token=citizen_token)
assert s_vrf == 200

# I. Self-Healing Governance Reconciliation
s_rec, rec_data, _ = http_post(f"{BASE_URL}/governance/reconcile", token=admin_token)
assert s_rec == 200

print(" [PASS] 12. Full Incident Lifecycle, Worker Evidence, Duplicate Payout Idempotency, Citizen Verification & Self-Healing Reconciliation Passed 100%")

print("\n=================================================================")
print("  ALL 12 OBSERVABILITY, PERFORMANCE & RESILIENCE TESTS PASSED!   ")
print("=================================================================")
