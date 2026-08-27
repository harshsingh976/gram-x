import urllib.request
import json
import datetime

BASE_URL = "http://127.0.0.1:8000/api"

def http_post(url, data=None, token=None):
    req = urllib.request.Request(url, method="POST")
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    body = json.dumps(data).encode("utf-8") if data is not None else None
    with urllib.request.urlopen(req, data=body) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

def http_get(url, token=None):
    req = urllib.request.Request(url, method="GET")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))

# Login
_, res = http_post(f"{BASE_URL}/auth/login", {"username": "admin", "password": "admin123"})
admin_token = res["access_token"]

# Query audit logs
_, initial_logs = http_get(f"{BASE_URL}/audit/logs", token=admin_token)
initial_esc_count = len([l for l in initial_logs if l["action"] == "INCIDENT_ESCALATED"])

# Query once to allow initial escalation evaluation
http_get(f"{BASE_URL}/incidents", token=admin_token)
_, post_logs_1 = http_get(f"{BASE_URL}/audit/logs", token=admin_token)
esc_count_after_first = len([l for l in post_logs_1 if l["action"] == "INCIDENT_ESCALATED"])

# Query 10 more times (simulating repeat dashboard refreshes)
for _ in range(10):
    http_get(f"{BASE_URL}/incidents", token=admin_token)
    http_get(f"{BASE_URL}/tasks", token=admin_token)

_, post_logs_10 = http_get(f"{BASE_URL}/audit/logs", token=admin_token)
esc_count_after_ten = len([l for l in post_logs_10 if l["action"] == "INCIDENT_ESCALATED"])

print(f"Escalations after first query: {esc_count_after_first}")
print(f"Escalations after 10 subsequent queries: {esc_count_after_ten}")
assert esc_count_after_first == esc_count_after_ten, "Duplicate escalation events detected!"
print("[OK] Duplicate Escalation Protection Verified: Exactly idempotent across repeated refreshes.")
