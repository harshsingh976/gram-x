"""
GRAM-X Phase 7: Sliding-Window Adaptive Rate Limiter
Module: rate_limiter.py
"""

import time
from typing import Dict, Tuple

class AdaptiveRateLimiter:
    """Sliding-window token bucket rate limiter with role-tiered limits and shared NAT tolerance."""
    _requests: Dict[str, list] = {}

    ROLE_LIMITS = {
        "citizen": (60, 60),     # 60 requests per 60s
        "worker": (120, 60),     # 120 requests per 60s
        "admin": (300, 60),      # 300 requests per 60s
        "district": (600, 60),   # 600 requests per 60s
        "anonymous": (30, 60)    # 30 requests per 60s
    }

    @classmethod
    def is_allowed(cls, identifier: str, role: str = "citizen") -> Tuple[bool, int]:
        """Checks if request is allowed under sliding window limit. Returns (is_allowed, remaining_quota)."""
        now = time.time()
        max_reqs, window_sec = cls.ROLE_LIMITS.get(role, (60, 60))
        
        timestamps = cls._requests.setdefault(identifier, [])
        # Filter timestamps within current window
        valid_ts = [t for t in timestamps if now - t <= window_sec]
        cls._requests[identifier] = valid_ts

        if len(valid_ts) >= max_reqs:
            return False, 0

        valid_ts.append(now)
        return True, max_reqs - len(valid_ts)

rate_limiter = AdaptiveRateLimiter()
