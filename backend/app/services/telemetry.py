import time
from collections import deque
import threading
from typing import Dict, Any

class SystemTelemetry:
    """
    Thread-safe, privacy-preserving operational metrics collector for GRAM-X.
    Never collects secrets, passwords, tokens, or PII.
    """
    def __init__(self):
        self._lock = threading.Lock()
        self.start_time = time.time()
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.slow_requests_count = 0
        self.error_4xx_count = 0
        self.error_5xx_count = 0
        self.auth_failures_count = 0
        self.authz_denials_count = 0
        self.failed_mutations_count = 0
        self.db_failures_count = 0
        self.total_response_time_ms = 0.0
        self.recent_latencies = deque(maxlen=100)
        self.reconciliation_failures = 0
        self.notification_failures = 0

    def record_request(self, method: str, path: str, status_code: int, duration_ms: float):
        with self._lock:
            self.total_requests += 1
            self.total_response_time_ms += duration_ms
            self.recent_latencies.append(duration_ms)

            if duration_ms > 500.0:
                self.slow_requests_count += 1

            if 200 <= status_code < 400:
                self.successful_requests += 1
            elif 400 <= status_code < 500:
                self.failed_requests += 1
                self.error_4xx_count += 1
                if status_code == 401:
                    self.auth_failures_count += 1
                elif status_code == 403:
                    self.authz_denials_count += 1
                if method in ["POST", "PUT", "DELETE", "PATCH"]:
                    self.failed_mutations_count += 1
            elif status_code >= 500:
                self.failed_requests += 1
                self.error_5xx_count += 1
                if method in ["POST", "PUT", "DELETE", "PATCH"]:
                    self.failed_mutations_count += 1

    def record_db_failure(self):
        with self._lock:
            self.db_failures_count += 1

    def record_notification_failure(self):
        with self._lock:
            self.notification_failures += 1

    def record_reconciliation_failure(self):
        with self._lock:
            self.reconciliation_failures += 1

    def get_metrics(self, db_healthy: bool = True, governance_summary: Dict[str, Any] = None) -> Dict[str, Any]:
        with self._lock:
            uptime_seconds = round(time.time() - self.start_time, 1)
            avg_latency = round(sum(self.recent_latencies) / len(self.recent_latencies), 2) if self.recent_latencies else 0.0
            error_rate_pct = round((self.failed_requests / self.total_requests * 100), 2) if self.total_requests > 0 else 0.0

            # Component health evaluation
            api_health = "HEALTHY"
            if self.error_5xx_count > 5 or error_rate_pct > 25.0:
                api_health = "CRITICAL"
            elif self.error_5xx_count > 0 or error_rate_pct > 10.0 or self.slow_requests_count > 20:
                api_health = "DEGRADED"

            db_health = "HEALTHY" if (db_healthy and self.db_failures_count == 0) else ("DEGRADED" if db_healthy else "UNAVAILABLE")
            notif_health = "HEALTHY" if self.notification_failures == 0 else "DEGRADED"
            rec_health = "HEALTHY" if self.reconciliation_failures == 0 else "DEGRADED"

            sla_health = "HEALTHY"
            gov_health = "HEALTHY"
            if governance_summary:
                if governance_summary.get("sla_breaches", 0) > 0:
                    sla_health = "ATTENTION_REQUIRED"
                if governance_summary.get("citizen_outcome_gaps", 0) > 0 or governance_summary.get("financial_warning", False):
                    gov_health = "ATTENTION_REQUIRED"

            return {
                "uptime_seconds": uptime_seconds,
                "total_requests": self.total_requests,
                "successful_requests": self.successful_requests,
                "failed_requests": self.failed_requests,
                "average_response_time_ms": avg_latency,
                "slow_requests_count": self.slow_requests_count,
                "error_4xx_count": self.error_4xx_count,
                "error_5xx_count": self.error_5xx_count,
                "auth_failures_count": self.auth_failures_count,
                "authz_denials_count": self.authz_denials_count,
                "failed_mutations_count": self.failed_mutations_count,
                "db_failures_count": self.db_failures_count,
                "reconciliation_failures": self.reconciliation_failures,
                "notification_failures": self.notification_failures,
                "critical_errors": self.error_5xx_count + self.db_failures_count,
                "components": {
                    "api_health": api_health,
                    "database": db_health,
                    "governance_engine": gov_health,
                    "notification_engine": notif_health,
                    "sla_engine": sla_health,
                    "reconciliation": rec_health,
                    "failed_requests": self.failed_requests,
                    "critical_errors": self.error_5xx_count + self.db_failures_count
                }
            }

telemetry = SystemTelemetry()
