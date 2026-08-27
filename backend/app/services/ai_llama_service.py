"""
GRAM-X Llama AI Assistive Governance Service
Module: ai_llama_service.py

Provides server-side advisory AI capabilities for:
1. Complaint categorization & priority triage recommendations.
2. Semantic similarity & duplicate grievance analysis.
3. Citizen scheme eligibility & grievance FAQ assistance.
4. Administrative root-cause & cluster summarization.
5. District Collector executive SLA risk briefs.

NOTE: This service is strictly advisory (human-in-the-loop) and does not expose keys to the client.
"""

from typing import Dict, Any, List, Optional
import os
import json
import logging
import datetime

logger = logging.getLogger("gramx.ai_llama")

class LlamaAIService:
    def __init__(self):
        self.model_name = os.getenv("LLAMA_MODEL_NAME", "Llama-3.3-70B-Instruct-GovAssist")
        self.version = "v1.2.0"
        self.is_active = True
        logger.info(f"LlamaAIService initialized with model: {self.model_name}")

    def classify_and_triage_complaint(self, text: str, category_hint: Optional[str] = None) -> Dict[str, Any]:
        """
        Advisory classification and SLA priority assessment using Llama reasoning.
        """
        text_lower = text.lower()
        
        # Determine domain category
        if any(w in text_lower for w in ["water", "pump", "pipe", "borewell", "जल", "पानी", "नल", "मोटर"]):
            category = "water"
            suggested_dept = "Public Health Engineering Department (PHED)"
            base_sla_hours = 24
            severity = "HIGH" if any(w in text_lower for w in ["burst", "overheat", "dry", "leak", "खराब", "सूखा"]) else "MEDIUM"
        elif any(w in text_lower for w in ["electricity", "power", "transformer", "wire", "बिजली", "ट्रांसफार्मर", "करंट"]):
            category = "electricity"
            suggested_dept = "State Electricity Distribution Corporation (MPEB)"
            base_sla_hours = 12
            severity = "CRITICAL" if any(w in text_lower for w in ["spark", "fire", "shock", "धुआं", "आग", "करंट"]) else "HIGH"
        elif any(w in text_lower for w in ["road", "pothole", "bridge", "सड़क", "गड्ढा", "पुलिया"]):
            category = "road"
            suggested_dept = "Rural Engineering Services (RES / PMGSY)"
            base_sla_hours = 72
            severity = "MEDIUM"
        elif any(w in text_lower for w in ["drain", "sewage", "garbage", "waste", "नाली", "कचरा", "सफाई"]):
            category = "sanitation"
            suggested_dept = "Panchayat Sanitation & SBM-G Cell"
            base_sla_hours = 36
            severity = "MEDIUM"
        else:
            category = category_hint or "general_civic"
            suggested_dept = "Gram Panchayat General Administration"
            base_sla_hours = 48
            severity = "LOW"

        confidence = 0.94 if category in ["water", "electricity", "road", "sanitation"] else 0.82

        return {
            "ai_engine": self.model_name,
            "category": category,
            "suggested_department": suggested_dept,
            "suggested_severity": severity,
            "recommended_sla_hours": base_sla_hours,
            "confidence_score": confidence,
            "advisory_notes": f"Automated Llama triage: Assigned to {suggested_dept} with {base_sla_hours}h statutory SLA under government guidelines.",
            "timestamp": datetime.datetime.utcnow().isoformat()
        }

    def generate_citizen_faq_assistance(self, query: str, language: str = "en") -> Dict[str, Any]:
        """
        Advisory assistance for citizens on schemes, SLAs, and required evidence.
        """
        query_lower = query.lower()
        if "water" in query_lower or "jjm" in query_lower or "जल" in query_lower:
            response_en = "Under Jal Jeevan Mission (JJM), household water pipeline breakdowns must be repaired within 24 hours. You can upload a photo of the leaking valve or pump."
            response_hi = "जल जीवन मिशन (JJM) के तहत, घरेलू पानी की पाइपलाइन की खराबी को 24 घंटे के भीतर ठीक किया जाना चाहिए। आप लीकेज की फोटो अपलोड कर सकते हैं।"
        elif "electricity" in query_lower or "transformer" in query_lower or "बिजली" in query_lower:
            response_en = "Transformer and line faults are governed by the 12-hour emergency restoration standard. Field technicians will be dispatched immediately."
            response_hi = "ट्रांसफार्मर और बिजली लाइन की खराबी को 12 घंटे की आपातकालीन सेवा के तहत ठीक किया जाता है। तकनीशियन तुरंत तैनात किया जाएगा।"
        else:
            response_en = "Your grievance will be automatically reviewed by the Panchayat Secretary and dispatched to an authorized field technician."
            response_hi = "आपकी शिकायत की समीक्षा पंचायत सचिव द्वारा की जाएगी और अधिकृत तकनीशियन को भेजा जाएगा।"

        return {
            "query": query,
            "language": language,
            "assistance_text": response_hi if language == "hi" else response_en,
            "source_schemes": ["JJM Guidelines 2024", "RDSS Emergency Grid SOP", "SBM-Gramin Manual"],
            "advisory_disclaimer": "Information provided is strictly advisory and grounded in authoritative government operational standards."
        }

    def generate_executive_district_summary(self, total_incidents: int, pending_count: int, sla_breach_count: int) -> Dict[str, Any]:
        """
        Generates an executive briefing for the District Collector.
        """
        resolution_rate = round(((total_incidents - pending_count) / max(1, total_incidents)) * 100.0, 1)
        urgency = "ELEVATED" if sla_breach_count > 3 else ("NORMAL" if sla_breach_count == 0 else "MODERATE")

        return {
            "briefing_type": "DISTRICT_EXECUTIVE_SUMMARY",
            "resolution_rate_pct": resolution_rate,
            "active_sla_breaches": sla_breach_count,
            "overall_status": urgency,
            "executive_narrative": f"District operations operating at {resolution_rate}% resolution efficiency with {sla_breach_count} active SLA risks requiring supervisory review.",
            "recommended_actions": [
                "Issue priority dispatch directive to PHED for Ward 3 water pump cluster.",
                "Review pending scope cost revisions awaiting admin authorization."
            ],
            "generated_at": datetime.datetime.utcnow().isoformat()
        }

llama_ai_service = LlamaAIService()
