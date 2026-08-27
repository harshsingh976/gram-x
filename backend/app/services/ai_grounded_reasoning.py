"""
GRAM-X AI 4.0: Knowledge-Grounded Reasoning & Canonical Query Rewriter Engine
Module: ai_grounded_reasoning.py
"""

import time
from typing import Dict, Any, List, Optional
from app.services.vector_service import vector_service

GOVERNMENT_SCHEME_KNOWLEDGE = [
    {
        "id": 1,
        "title": "Jal Jeevan Mission (JJM) Rural Water Supply Guidelines",
        "category": "water",
        "department": "Public Health Engineering",
        "summary": "Mandates 55 liters per capita per day potable drinking water to every rural household through Functional Household Tap Connections (FHTC). Requires 24-hour turnaround on handpump repair.",
        "content": "Standards for rural drinking water pipeline depth (minimum 0.9m), handpump cylinder repair protocol, riser pipe corrosion inspection, and chlorine residual testing standards.",
        "sla_hours": 24,
        "role_visibility": "all"
    },
    {
        "id": 2,
        "title": "Pradhan Mantri Gram Sadak Yojana (PMGSY) Road Maintenance Norms",
        "category": "roads",
        "department": "Public Works Department",
        "summary": "Prescribes all-weather road connectivity to eligible unconnected habitations and five-year periodic maintenance specifications for rural bituminous pavements.",
        "content": "Pothole patch repair specifications with dense bituminous macadam (DBM), culvert approach erosion prevention, paver block installation on village streets, and shoulder leveling.",
        "sla_hours": 48,
        "role_visibility": "all"
    },
    {
        "id": 3,
        "title": "Revamped Distribution Sector Scheme (RDSS) Electricity Standards",
        "category": "electricity",
        "department": "State Electricity Distribution (DISCOM)",
        "summary": "Improves power supply reliability, feeder separation, and rapid replacement of failed distribution transformers in rural zones.",
        "content": "Norms for transformer failure replacement within 24 hours in rural areas, replacement of sagging high-tension bare conductors with Aerial Bunched Cables (ABC), and streetlighting timer repairs.",
        "sla_hours": 24,
        "role_visibility": "all"
    },
    {
        "id": 4,
        "title": "Swachh Bharat Mission (Gramin) Solid Waste Management Guidelines",
        "category": "sanitation",
        "department": "Swachh Bharat Gramin / Panchayat",
        "summary": "Guidelines for ODF Plus status, segregated door-to-door waste collection, and community composting in gram panchayats.",
        "content": "Daily collection of biodegradable waste, maintenance of community sanitary complexes, prohibition of open garbage burning near habitations, and animal carcass clearance protocols within 12 hours.",
        "sla_hours": 12,
        "role_visibility": "all"
    },
    {
        "id": 5,
        "title": "Panchayat Stormwater Drainage & Culvert Maintenance Manual",
        "category": "drainage",
        "department": "Minor Irrigation / Panchayat Works",
        "summary": "Standard operating procedures for desilting monsoon stormwater drains and preventing village road waterlogging.",
        "content": "Pre-monsoon culvert silt removal, gradient correction for stagnant open drains, concrete slab cover placement over open gutters, and mosquito breeding prevention with larvicide.",
        "sla_hours": 36,
        "role_visibility": "all"
    }
]

class CanonicalQueryRewriter:
    """Transforms informal/regional complaint phrases into canonical government retrieval queries."""
    CANONICAL_DOMAINS = {
        "water": "Jal Jeevan Mission drinking water supply handpump pipeline repair norms",
        "roads": "PMGSY rural road pothole maintenance and bituminous pavement repair",
        "electricity": "Rural electricity distribution transformer outage and power conductor wire repair",
        "sanitation": "Swachh Bharat Gramin solid waste management and community sanitation guidelines",
        "drainage": "Stormwater drainage desilting culvert maintenance and waterlogging prevention"
    }

    @classmethod
    def rewrite_for_retrieval(cls, raw_text: str, predicted_category: str) -> Dict[str, Any]:
        canonical_expansion = cls.CANONICAL_DOMAINS.get(predicted_category, "Panchayat civic infrastructure standards")
        retrieval_query = f"{raw_text} {canonical_expansion}"
        return {
            "original_query": raw_text,
            "canonical_domain_query": retrieval_query,
            "target_category": predicted_category
        }


class GroundedReasoningEngine:
    """Performs hybrid retrieval and generates evidence-grounded decision explanations."""
    def __init__(self):
        self.rewriter = CanonicalQueryRewriter()

    def reason_and_ground(
        self,
        complaint_text: str,
        category: str,
        user_role: str = "citizen"
    ) -> Dict[str, Any]:
        start_time = time.time()
        
        # 1. Query Rewriting
        rw = self.rewriter.rewrite_for_retrieval(complaint_text, category)
        
        # 2. Hybrid Retrieval on Government Scheme SOPs
        class KnowledgeDoc:
            def __init__(self, d):
                self.id = d["id"]
                self.title = d["title"]
                self.category = d["category"]
                self.department = d["department"]
                self.summary = d["summary"]
                self.content = d["content"]
                self.role_visibility = d.get("role_visibility", "all")
                
        docs = [KnowledgeDoc(d) for d in GOVERNMENT_SCHEME_KNOWLEDGE]
        
        retrieved_hits = vector_service.search_knowledge_articles(
            query=rw["canonical_domain_query"],
            articles=docs,
            user_role=user_role,
            category=category,
            limit=2
        )
        
        top_hit = retrieved_hits[0] if retrieved_hits else None
        groundedness_score = top_hit.get("groundedness_score", 0.90) if top_hit else 0.50
        
        # 3. Grounded Decision Output
        if top_hit:
            explanation = (
                f"Complaint categorized under '{category.upper()}' governed by '{top_hit.get('title')}'. "
                f"Mandatory SLA is {top_hit.get('sla_hours', 24)}h. "
                f"SOP protocol mandates standard repair under {top_hit.get('department')}."
            )
        else:
            explanation = f"Complaint categorized under standard Gram Panchayat {category} protocol."

        elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
        
        return {
            "status": "SUCCESS",
            "category": category,
            "canonical_query": rw["canonical_domain_query"],
            "groundedness_score": groundedness_score,
            "is_authoritative_grounded": groundedness_score >= 0.80,
            "top_policy_citation": top_hit.get("title") if top_hit else None,
            "governing_department": top_hit.get("department") if top_hit else "Gram Panchayat Administration",
            "statutory_sla_hours": top_hit.get("sla_hours", 24) if top_hit else 24,
            "grounded_explanation": explanation,
            "retrieved_articles_count": len(retrieved_hits),
            "reasoning_latency_ms": elapsed_ms
        }


# Global singleton instance
grounded_reasoning_engine = GroundedReasoningEngine()
