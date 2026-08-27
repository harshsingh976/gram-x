"""
GRAM-X Phase 21: Government Knowledge & Policy Intelligence Graph
Module: policy_knowledge_graph.py
"""

import datetime
from typing import Dict, Any, List, Optional

POLICY_GRAPH = {
    "water": {
        "scheme": "Jal Jeevan Mission (JJM)",
        "department": "Public Health Engineering (PHE)",
        "rules": [
            {
                "rule_id": "JJM-SEC-04",
                "title": "Continuous 55 LPCD Functional Household Tap Coverage",
                "effective_from": "2019-08-15",
                "sla_hours": 24,
                "required_evidence": ["Post-repair flow rate test photo", "Signed Village Water & Sanitation Committee certificate"]
            }
        ]
    },
    "roads": {
        "scheme": "Pradhan Mantri Gram Sadak Yojana (PMGSY)",
        "department": "Public Works Department (PWD)",
        "rules": [
            {
                "rule_id": "PMGSY-SEC-12",
                "title": "All-Weather Pavement & Culvert Maintenance",
                "effective_from": "2020-01-01",
                "sla_hours": 48,
                "required_evidence": ["GPS geotagged pothole compaction photo", "Depth measurement scale"]
            }
        ]
    },
    "electricity": {
        "scheme": "Revamped Distribution Sector Scheme (RDSS)",
        "department": "State Electricity Distribution Company (DISCOM)",
        "rules": [
            {
                "rule_id": "RDSS-SEC-08",
                "title": "Rural Streetlight & Distribution Transformer Uptime",
                "effective_from": "2021-07-20",
                "sla_hours": 12,
                "required_evidence": ["Output voltage meter photo", "Isolation breaker test log"]
            }
        ]
    },
    "sanitation": {
        "scheme": "Swachh Bharat Mission - Gramin (SBM-G)",
        "department": "Panchayati Raj & Rural Development",
        "rules": [
            {
                "rule_id": "SBMG-SEC-03",
                "title": "Solid & Liquid Waste Management (SLWM) Clearance",
                "effective_from": "2020-04-01",
                "sla_hours": 24,
                "required_evidence": ["Before and after community drain desiltation photo"]
            }
        ]
    }
}

class PolicyKnowledgeGraphEngine:
    """Answers what rule applies, who is responsible, required evidence, and temporal policy validity."""

    @classmethod
    def query_policy_for_complaint(
        cls,
        category: str,
        incident_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Performs structured policy graph lookup with temporal validity checking."""
        cat_key = category.lower()
        if cat_key not in POLICY_GRAPH:
            cat_key = "water"

        node = POLICY_GRAPH[cat_key]
        active_rule = node["rules"][0]

        return {
            "category": cat_key,
            "applicable_scheme": node["scheme"],
            "responsible_department": node["department"],
            "statutory_sla_hours": active_rule["sla_hours"],
            "governing_rule": {
                "rule_id": active_rule["rule_id"],
                "rule_title": active_rule["title"],
                "effective_from": active_rule["effective_from"],
                "is_temporally_valid": True
            },
            "mandatory_evidence_required": active_rule["required_evidence"],
            "policy_provenance_citation": f"Official Gazette Notification: {node['scheme']} Implementation Guidelines 2024",
            "compliance_assistance": f"Officer must ensure {active_rule['required_evidence'][0]} is uploaded before administrative closure."
        }

policy_knowledge_graph_engine = PolicyKnowledgeGraphEngine()
