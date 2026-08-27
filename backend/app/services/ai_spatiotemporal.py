"""
GRAM-X AI 4.0: Spatiotemporal Intelligence & Multilingual Semantic Duplicate Detection
Module: ai_spatiotemporal.py
"""

import math
import time
import datetime
from typing import Dict, Any, List, Optional, Tuple
import numpy as np

from app.services.ai_classifier import vectorizer, semantic_classifier, CATEGORIES

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in kilometers."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 3)

def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(v1, v2) / (norm1 * norm2))

def compute_multilingual_similarity(text1: str, text2: str) -> float:
    """Computes cross-lingual semantic similarity combining Subword Vector and Softmax Probability Alignment."""
    v1 = vectorizer.transform(text1)
    v2 = vectorizer.transform(text2)
    vec_sim = cosine_similarity(v1, v2)
    
    p1 = semantic_classifier.predict(text1)["probabilities"]
    p2 = semantic_classifier.predict(text2)["probabilities"]
    vp1 = np.array([p1[c] for c in CATEGORIES])
    vp2 = np.array([p2[c] for c in CATEGORIES])
    prob_sim = cosine_similarity(vp1, vp2)
    
    return float((0.40 * vec_sim) + (0.60 * prob_sim))


class SpatiotemporalEngine:
    """Detects multilingual duplicate grievances and detects localized spatiotemporal problem clusters."""
    def __init__(self):
        self.semantic_threshold = 0.65
        self.spatial_threshold_km = 3.0
        self.temporal_threshold_hours = 72.0

    def find_semantic_duplicates(
        self,
        query_text: str,
        query_lat: Optional[float],
        query_lon: Optional[float],
        query_time: Optional[datetime.datetime],
        existing_incidents: List[Dict[str, Any]],
        similarity_threshold: float = 0.65
    ) -> List[Dict[str, Any]]:
        """
        Finds multilingual duplicate grievances (e.g. Hindi vs English vs Dialect)
        within temporal window and spatial neighborhood.
        """
        query_time = query_time or datetime.datetime.utcnow()
        duplicates = []

        for inc in existing_incidents:
            inc_text = inc.get("title", "") + " " + inc.get("description", "")
            sim = compute_multilingual_similarity(query_text, inc_text)
            
            # Check spatial distance if coordinates provided
            inc_lat = inc.get("latitude")
            inc_lon = inc.get("longitude")
            geo_dist_km = None
            if query_lat is not None and query_lon is not None and inc_lat is not None and inc_lon is not None:
                geo_dist_km = haversine_distance_km(query_lat, query_lon, float(inc_lat), float(inc_lon))
                
            # Check temporal delta
            inc_time = inc.get("created_at")
            hours_diff = None
            if isinstance(inc_time, str):
                try:
                    inc_time = datetime.datetime.fromisoformat(inc_time.replace("Z", "+00:00"))
                except Exception:
                    inc_time = None
            if inc_time and isinstance(inc_time, datetime.datetime):
                # Make timezone naive if needed for comparison
                t1 = query_time.replace(tzinfo=None)
                t2 = inc_time.replace(tzinfo=None)
                hours_diff = abs((t1 - t2).total_seconds() / 3600.0)

            # Combined duplicate scoring
            is_match = sim >= similarity_threshold
            if geo_dist_km is not None and geo_dist_km > self.spatial_threshold_km:
                is_match = False
            if hours_diff is not None and hours_diff > self.temporal_threshold_hours:
                is_match = False

            if is_match:
                duplicates.append({
                    "incident_id": inc.get("id"),
                    "title": inc.get("title"),
                    "category": inc.get("category"),
                    "semantic_similarity": round(sim, 3),
                    "spatial_distance_km": geo_dist_km,
                    "temporal_delta_hours": round(hours_diff, 1) if hours_diff is not None else None,
                    "status": inc.get("status"),
                    "duplicate_confidence": round(min(0.99, sim * (1.05 if (geo_dist_km and geo_dist_km < 1.0) else 1.0)), 3)
                })

        # Sort descending by duplicate confidence
        duplicates.sort(key=lambda x: x["duplicate_confidence"], reverse=True)
        return duplicates

    def cluster_spatiotemporal_incidents(
        self,
        incidents: List[Dict[str, Any]],
        max_cluster_distance: float = 0.45
    ) -> List[Dict[str, Any]]:
        """
        Executes normalized distance graph clustering combining Semantic Distance,
        Geographic Distance (Haversine), and Time-Delta.
        """
        n = len(incidents)
        if n < 2:
            return []

        # Extract vectors and metadata
        vectors = [vectorizer.vectorize(inc.get("title", "") + " " + inc.get("description", "")) for inc in incidents]
        
        # Build adjacency matrix
        adj = np.zeros((n, n), dtype=bool)
        for i in range(n):
            for j in range(i + 1, n):
                sim = cosine_similarity(vectors[i], vectors[j])
                sem_dist = max(0.0, 1.0 - sim)
                
                # Geo distance
                lat1, lon1 = incidents[i].get("latitude"), incidents[i].get("longitude")
                lat2, lon2 = incidents[j].get("latitude"), incidents[j].get("longitude")
                if lat1 and lon1 and lat2 and lon2:
                    geo_km = haversine_distance_km(float(lat1), float(lon1), float(lat2), float(lon2))
                    norm_geo = min(1.0, geo_km / 5.0)
                else:
                    norm_geo = 0.20 # Neutral default
                    
                combined_dist = (0.60 * sem_dist) + (0.40 * norm_geo)
                if combined_dist <= max_cluster_distance and incidents[i].get("category") == incidents[j].get("category"):
                    adj[i, j] = True
                    adj[j, i] = True

        # Connected components discovery
        visited = set()
        clusters = []
        for i in range(n):
            if i not in visited:
                comp = []
                queue = [i]
                visited.add(i)
                while queue:
                    curr = queue.pop(0)
                    comp.append(curr)
                    for neighbor in range(n):
                        if adj[curr, neighbor] and neighbor not in visited:
                            visited.add(neighbor)
                            queue.append(neighbor)
                if len(comp) >= 2:
                    cluster_items = [incidents[idx] for idx in comp]
                    cat = cluster_items[0].get("category", "water")
                    avg_lat = np.mean([float(it["latitude"]) for it in cluster_items if it.get("latitude")]) if any(it.get("latitude") for it in cluster_items) else None
                    avg_lon = np.mean([float(it["longitude"]) for it in cluster_items if it.get("longitude")]) if any(it.get("longitude") for it in cluster_items) else None
                    
                    clusters.append({
                        "cluster_id": f"CLUST-SPATIO-{len(clusters)+1:03d}",
                        "category": cat,
                        "incident_count": len(comp),
                        "incident_ids": [it.get("id") for it in cluster_items],
                        "center_coordinates": [round(float(avg_lat), 4), round(float(avg_lon), 4)] if avg_lat and avg_lon else None,
                        "severity_score": round(len(comp) * 18.5, 1),
                        "root_cause_indication": f"Localized multi-point {cat.upper()} disruption concentrated in same spatial radius."
                    })

        return clusters


# Global singleton instance
spatiotemporal_engine = SpatiotemporalEngine()
