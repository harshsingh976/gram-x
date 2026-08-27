"""
GRAM-X Enterprise AI Dataset Engineering & Gold Standard Corpus
Module: ai_dataset.py
Dataset Version: 2.5.0-gold-bilingual-multilingual
"""

import json
import hashlib
import random
from typing import List, Dict, Any, Tuple

DATASET_VERSION = "2.5.0-gold"

GOLD_COMPLAINT_DATASET = [
    # ─── 1. WATER SUPPLY (9 records) ───
    {"id": "WAT-001", "text": "हमारो पानी को हैंड़पंप पिपर्ली रोड पै टूट गयो है चार दिन से पानी नई निकरो है", "language": "hi-bundeli", "category": "water", "subcategory": "Drinking Water Infrastructure", "issue_type": "Handpump Breakdown", "department": "Public Health Engineering (PHE)", "severity": "high", "is_hard_negative": False},
    {"id": "WAT-002", "text": "वार्ड 2 में मुख्य पेयजल पाइपलाइन फट गई है और स्वच्छ पानी बर्बाद हो रहा है", "language": "hi", "category": "water", "subcategory": "Drinking Water Infrastructure", "issue_type": "Main Pipeline Burst", "department": "Public Health Engineering (PHE)", "severity": "critical", "is_hard_negative": True},
    {"id": "WAT-003", "text": "Drinking water supply has been completely halted in Ward 4 due to pump motor burnout", "language": "en", "category": "water", "subcategory": "Drinking Water Infrastructure", "issue_type": "Pump Motor Failure", "department": "Public Health Engineering (PHE)", "severity": "high", "is_hard_negative": False},
    {"id": "WAT-004", "text": "हमारे गांव में ward 2 की water supply tap line leak हो रही है तुरंत रिपेयर चाहिए", "language": "hinglish", "category": "water", "subcategory": "Drinking Water Infrastructure", "issue_type": "Tap Standpost Leakage", "department": "Public Health Engineering (PHE)", "severity": "medium", "is_hard_negative": False},
    {"id": "WAT-005", "text": "सामुदायिक कुएं की मोटर खराब हो गई है और पीने का पानी उपलब्ध नहीं है", "language": "hi", "category": "water", "subcategory": "Drinking Water Infrastructure", "issue_type": "Well Motor Breakdown", "department": "Public Health Engineering (PHE)", "severity": "high", "is_hard_negative": False},
    {"id": "WAT-006", "text": "Water overhead tank valve is defective causing drinking water overflow on street", "language": "en", "category": "water", "subcategory": "Drinking Water Infrastructure", "issue_type": "Overhead Tank Valve Failure", "department": "Public Health Engineering (PHE)", "severity": "medium", "is_hard_negative": True},
    {"id": "WAT-007", "text": "नल-जल योजना के तहत नल से गंदा और बदबूदार पानी आ रहा है", "language": "hi", "category": "water", "subcategory": "Drinking Water Infrastructure", "issue_type": "Drinking Water Contamination", "department": "Public Health Engineering (PHE)", "severity": "critical", "is_hard_negative": True},
    {"id": "WAT-008", "text": "Borewell motor starter coil burnt in agricultural colony drinking point", "language": "en", "category": "water", "subcategory": "Drinking Water Infrastructure", "issue_type": "Borewell Starter Coil Fault", "department": "Public Health Engineering (PHE)", "severity": "high", "is_hard_negative": False},
    {"id": "WAT-009", "text": "जल वितरण स्टैंडपोस्ट का वाल्व जाम हो गया है पानी नहीं आ रहा", "language": "hi-bundeli", "category": "water", "subcategory": "Drinking Water Infrastructure", "issue_type": "Standpost Valve Jam", "department": "Public Health Engineering (PHE)", "severity": "medium", "is_hard_negative": False},

    # ─── 2. ROADS (9 records) ───
    {"id": "ROA-001", "text": "गांव की मुख्य सड़क पर बड़ा गड्ढा हो गया है गाड़ियां निकलने में दुर्घटना का खतरा है", "language": "hi", "category": "roads", "subcategory": "Panchayat Roadway Network", "issue_type": "Deep Asphalt Pothole", "department": "Public Works Department (PWD)", "severity": "high", "is_hard_negative": False},
    {"id": "ROA-002", "text": "पिपर्ली संपर्क मार्ग की डामर सड़क पूरी तरह उखड़ गई है और केवल पत्थर बचे हैं", "language": "hi-bundeli", "category": "roads", "subcategory": "Panchayat Roadway Network", "issue_type": "Surface Layer Erosion", "department": "Public Works Department (PWD)", "severity": "high", "is_hard_negative": False},
    {"id": "ROA-003", "text": "Main village approach road has developed severe cracks and culvert edge erosion", "language": "en", "category": "roads", "subcategory": "Panchayat Roadway Network", "issue_type": "Culvert Approach Road Erosion", "department": "Public Works Department (PWD)", "severity": "high", "is_hard_negative": True},
    {"id": "ROA-004", "text": "Roadway pothole near school gate is causing school vans to get stuck everyday", "language": "hinglish", "category": "roads", "subcategory": "Panchayat Roadway Network", "issue_type": "Pothole Congestion near Public Facility", "department": "Public Works Department (PWD)", "severity": "high", "is_hard_negative": False},
    {"id": "ROA-005", "text": "बरसात के कारण मुख्य मार्ग पर कटाव हो गया है और पुलिया के पास रास्ता धंस गया है", "language": "hi", "category": "roads", "subcategory": "Panchayat Roadway Network", "issue_type": "Road Shoulder Washout", "department": "Public Works Department (PWD)", "severity": "critical", "is_hard_negative": False},
    {"id": "ROA-006", "text": "Village market street interlocking paver tiles have collapsed", "language": "en", "category": "roads", "subcategory": "Panchayat Roadway Network", "issue_type": "Interlocking Tile Collapse", "department": "Public Works Department (PWD)", "severity": "medium", "is_hard_negative": False},
    {"id": "ROA-007", "text": "कच्चे रास्ते पर भारी कीचड़ और गड्ढे होने से ट्रैक्टर भी नहीं निकल पा रहा है", "language": "hi-bundeli", "category": "roads", "subcategory": "Panchayat Roadway Network", "issue_type": "Unpaved Track Degraded", "department": "Public Works Department (PWD)", "severity": "high", "is_hard_negative": False},
    {"id": "ROA-008", "text": "Asphalt topcoat has washed away completely on bridge approach road", "language": "en", "category": "roads", "subcategory": "Panchayat Roadway Network", "issue_type": "Bridge Approach Asphalt Erosion", "department": "Public Works Department (PWD)", "severity": "high", "is_hard_negative": True},
    {"id": "ROA-009", "text": "सड़क का डिवाइडर टूट गया है और रोड़े बिखर गए हैं", "language": "hi", "category": "roads", "subcategory": "Panchayat Roadway Network", "issue_type": "Road Divider Barrier Defect", "department": "Public Works Department (PWD)", "severity": "medium", "is_hard_negative": False},

    # ─── 3. ELECTRICITY (9 records) ───
    {"id": "ELE-001", "text": "वार्ड 3 में ट्रांसफार्मर से धुआं निकल रहा है और पूरे मोहल्ले में बिजली गुल है", "language": "hi", "category": "electricity", "subcategory": "Rural Power & Streetlighting", "issue_type": "Transformer Overheating & Outage", "department": "State Electricity Distribution (DISCOM)", "severity": "critical", "is_hard_negative": False},
    {"id": "ELE-002", "text": "रात को मुख्य चौराहे की सोलर स्ट्रीट लाइट बंद पड़ी है चारों तरफ अंधेरो है", "language": "hi-bundeli", "category": "electricity", "subcategory": "Rural Power & Streetlighting", "issue_type": "Solar Streetlight Luminary Failure", "department": "State Electricity Distribution (DISCOM)", "severity": "medium", "is_hard_negative": False},
    {"id": "ELE-003", "text": "High voltage overhead power line is hanging dangerously low over the public road", "language": "en", "category": "electricity", "subcategory": "Rural Power & Streetlighting", "issue_type": "Sagging High-Tension Conductor Wire", "department": "State Electricity Distribution (DISCOM)", "severity": "critical", "is_hard_negative": True},
    {"id": "ELE-004", "text": "Village feeder line voltage drop is causing all tube wells and motors to trip", "language": "hinglish", "category": "electricity", "subcategory": "Rural Power & Streetlighting", "issue_type": "Low Voltage Sag & Phase Imbalance", "department": "State Electricity Distribution (DISCOM)", "severity": "high", "is_hard_negative": True},
    {"id": "ELE-005", "text": "बिजली का खंभा आंधी में झुक गया है और तार टूटने की कगार पर है", "language": "hi", "category": "electricity", "subcategory": "Rural Power & Streetlighting", "issue_type": "Damaged Electric Pole Hazard", "department": "State Electricity Distribution (DISCOM)", "severity": "critical", "is_hard_negative": False},
    {"id": "ELE-006", "text": "Phase failure on distribution transformer leaving half the village in darkness", "language": "en", "category": "electricity", "subcategory": "Rural Power & Streetlighting", "issue_type": "Phase Failure Disruption", "department": "State Electricity Distribution (DISCOM)", "severity": "high", "is_hard_negative": False},
    {"id": "ELE-007", "text": "विद्युत मीटर बॉक्स में स्पार्किंग और शॉर्ट सर्किट हो रहा है", "language": "hi", "category": "electricity", "subcategory": "Rural Power & Streetlighting", "issue_type": "Meter Box Short Circuit", "department": "State Electricity Distribution (DISCOM)", "severity": "critical", "is_hard_negative": False},
    {"id": "ELE-008", "text": "Streetlight timer circuit broken, lights staying on during day and off at night", "language": "en", "category": "electricity", "subcategory": "Rural Power & Streetlighting", "issue_type": "Timer Control Switch Defect", "department": "State Electricity Distribution (DISCOM)", "severity": "low", "is_hard_negative": False},
    {"id": "ELE-009", "text": "बिजली की सप्लाई चार घंटे से कटी हुई है इन्वर्टर भी डिस्चार्ज हो गया", "language": "hi-bundeli", "category": "electricity", "subcategory": "Rural Power & Streetlighting", "issue_type": "Unscheduled Grid Outage", "department": "State Electricity Distribution (DISCOM)", "severity": "medium", "is_hard_negative": False},

    # ─── 4. SANITATION (9 records) ───
    {"id": "SAN-001", "text": "सार्वजनिक चौपाल के पास कचरे का बड़ा ढेर लगा हुआ है बदबू से बीमारियां फैलने का डर है", "language": "hi", "category": "sanitation", "subcategory": "Solid Waste & Village Sanitation", "issue_type": "Solid Waste Accumulation", "department": "Swachh Bharat Gramin / Panchayat", "severity": "high", "is_hard_negative": False},
    {"id": "SAN-002", "text": "सप्ताह भर से सफाई कर्मी नहीं आया है और सामुदायिक डस्टबिन कचरे से भर गया है", "language": "hi-bundeli", "category": "sanitation", "subcategory": "Solid Waste & Village Sanitation", "issue_type": "Uncollected Dustbin Overflow", "department": "Swachh Bharat Gramin / Panchayat", "severity": "medium", "is_hard_negative": False},
    {"id": "SAN-003", "text": "Uncollected organic garbage pile near weekly market is blocking the pedestrian pathway", "language": "en", "category": "sanitation", "subcategory": "Solid Waste & Village Sanitation", "issue_type": "Marketplace Waste Accumulation", "department": "Swachh Bharat Gramin / Panchayat", "severity": "high", "is_hard_negative": True},
    {"id": "SAN-004", "text": "Public toilet complex waste collection tank is not cleared and creating foul smell", "language": "hinglish", "category": "sanitation", "subcategory": "Solid Waste & Village Sanitation", "issue_type": "Public Toilet Sanitation Maintenance", "department": "Swachh Bharat Gramin / Panchayat", "severity": "high", "is_hard_negative": True},
    {"id": "SAN-005", "text": "गांव के मुख्य प्रवेश द्वार पर अवैध रूप से कूड़ा डाला जा रहा है तुरंत सफाई करवाएं", "language": "hi", "category": "sanitation", "subcategory": "Solid Waste & Village Sanitation", "issue_type": "Open Dumping on Public Land", "department": "Swachh Bharat Gramin / Panchayat", "severity": "medium", "is_hard_negative": False},
    {"id": "SAN-006", "text": "Solid waste burning near primary healthcare center causing respiratory distress", "language": "en", "category": "sanitation", "subcategory": "Solid Waste & Village Sanitation", "issue_type": "Hazardous Waste Incineration", "department": "Swachh Bharat Gramin / Panchayat", "severity": "critical", "is_hard_negative": False},
    {"id": "SAN-007", "text": "सामुदायिक शौचालय में गंदगी भरी है और पानी की टंकी में कीचड़ है", "language": "hi-bundeli", "category": "sanitation", "subcategory": "Solid Waste & Village Sanitation", "issue_type": "Sanitary Unit Unhygienic State", "department": "Swachh Bharat Gramin / Panchayat", "severity": "high", "is_hard_negative": True},
    {"id": "SAN-008", "text": "Compost pit boundary wall collapsed spilling decaying waste into street", "language": "en", "category": "sanitation", "subcategory": "Solid Waste & Village Sanitation", "issue_type": "Compost Pit Boundary Failure", "department": "Swachh Bharat Gramin / Panchayat", "severity": "medium", "is_hard_negative": False},
    {"id": "SAN-009", "text": "सड़क किनारे मरे हुए मवेशी का शव पड़ा है तुरंत उठवाने की व्यवस्था करें", "language": "hi", "category": "sanitation", "subcategory": "Solid Waste & Village Sanitation", "issue_type": "Carcass Removal Urgency", "department": "Swachh Bharat Gramin / Panchayat", "severity": "critical", "is_hard_negative": False},

    # ─── 5. DRAINAGE (9 records) ───
    {"id": "DRA-001", "text": "बरसात की नाली पूरी तरह जाम है गंदा पानी रास्ते पर भर रहा है और जलभराव हो गया है", "language": "hi", "category": "drainage", "subcategory": "Stormwater & Culvert Drainage", "issue_type": "Clogged Stormwater Drain & Waterlogging", "department": "Minor Irrigation / Panchayat Works", "severity": "high", "is_hard_negative": True},
    {"id": "DRA-002", "text": "नाली में प्लास्टिक कचरा और गाद भरने से नाली का पानी घरों के सामने बह रहा है", "language": "hi-bundeli", "category": "drainage", "subcategory": "Stormwater & Culvert Drainage", "issue_type": "Silt and Debris Drain Obstruction", "department": "Minor Irrigation / Panchayat Works", "severity": "high", "is_hard_negative": True},
    {"id": "DRA-003", "text": "Concrete roadside drainage culvert is choked causing black stagnant water overflow on pavement", "language": "en", "category": "drainage", "subcategory": "Stormwater & Culvert Drainage", "issue_type": "Culvert Silt Chokage & Stagnant Overflow", "department": "Minor Irrigation / Panchayat Works", "severity": "high", "is_hard_negative": True},
    {"id": "DRA-004", "text": "Stormwater drain bridge block ho gaya hai, ganda water road par stagnant hai", "language": "hinglish", "category": "drainage", "subcategory": "Stormwater & Culvert Drainage", "issue_type": "Drain Sump Obstruction", "department": "Minor Irrigation / Panchayat Works", "severity": "high", "is_hard_negative": True},
    {"id": "DRA-005", "text": "नाली का स्लैब टूट जाने से नाला अवरुद्ध हो गया है और कीचड़ फैल गया है", "language": "hi", "category": "drainage", "subcategory": "Stormwater & Culvert Drainage", "issue_type": "Broken Drain Slab & Siltation", "department": "Minor Irrigation / Panchayat Works", "severity": "medium", "is_hard_negative": False},
    {"id": "DRA-006", "text": "Sewage and monsoon runoff overflowing into community pond due to blocked outlet", "language": "en", "category": "drainage", "subcategory": "Stormwater & Culvert Drainage", "issue_type": "Pond Inlet Silt Obstruction", "department": "Minor Irrigation / Panchayat Works", "severity": "critical", "is_hard_negative": True},
    {"id": "DRA-007", "text": "पक्की नाली के निर्माण में ढलान उल्टी होने से नाली का गंदा पानी उल्टा बह रहा है", "language": "hi-bundeli", "category": "drainage", "subcategory": "Stormwater & Culvert Drainage", "issue_type": "Inverted Slope Drain Defect", "department": "Minor Irrigation / Panchayat Works", "severity": "high", "is_hard_negative": False},
    {"id": "DRA-008", "text": "Underground drain pipe collapsed causing sinkhole on street corner", "language": "en", "category": "drainage", "subcategory": "Stormwater & Culvert Drainage", "issue_type": "Underground Pipe Collapse Sinkhole", "department": "Minor Irrigation / Panchayat Works", "severity": "critical", "is_hard_negative": True},
    {"id": "DRA-009", "text": "नाली की सफाई न होने से मच्छर पनप रहे हैं और गंदा पानी रुका पड़ा है", "language": "hi", "category": "drainage", "subcategory": "Stormwater & Culvert Drainage", "issue_type": "Stagnant Drain Mosquito Hazard", "department": "Minor Irrigation / Panchayat Works", "severity": "medium", "is_hard_negative": True}
]

class DatasetManager:
    """Manages versioned complaint datasets, stratified splits, and feature matrices."""
    def __init__(self, data: List[Dict[str, Any]] = None):
        self.data = data or GOLD_COMPLAINT_DATASET
        self.version = DATASET_VERSION
        
    def get_dataset_stats(self) -> Dict[str, Any]:
        total = len(self.data)
        cat_counts: Dict[str, int] = {}
        lang_counts: Dict[str, int] = {}
        hard_neg_count = sum(1 for d in self.data if d.get("is_hard_negative", False))
        
        for d in self.data:
            c = d["category"]
            l = d["language"]
            cat_counts[c] = cat_counts.get(c, 0) + 1
            lang_counts[l] = lang_counts.get(l, 0) + 1
            
        payload_str = json.dumps(self.data, sort_keys=True)
        checksum = hashlib.sha256(payload_str.encode("utf-8")).hexdigest()
        
        return {
            "dataset_version": self.version,
            "total_records": total,
            "category_distribution": cat_counts,
            "language_distribution": lang_counts,
            "hard_negatives_count": hard_neg_count,
            "checksum_sha256": checksum
        }

    def stratified_split(self, train_ratio: float = 0.70, val_ratio: float = 0.15, seed: int = 42) -> Tuple[List[Dict], List[Dict], List[Dict]]:
        rng = random.Random(seed)
        by_cat: Dict[str, List[Dict]] = {}
        for d in self.data:
            by_cat.setdefault(d["category"], []).append(d)
            
        train, val, test = [], [], []
        for cat, items in by_cat.items():
            shuffled = list(items)
            rng.shuffle(shuffled)
            n = len(shuffled)
            n_train = max(1, int(n * train_ratio))
            n_val = max(1, int(n * val_ratio))
            
            train.extend(shuffled[:n_train])
            val.extend(shuffled[n_train:n_train + n_val])
            test.extend(shuffled[n_train + n_val:])
            
        if not test and val:
            test.append(val.pop())
            
        return train, val, test


class DataQualityEngine:
    """Pre-training data audit and quality validation engine."""
    VALID_CATEGORIES = {"water", "roads", "electricity", "sanitation", "drainage"}
    
    @classmethod
    def audit_dataset(cls, dataset: List[Dict[str, Any]]) -> Dict[str, Any]:
        total = len(dataset)
        issues = []
        
        seen_texts = set()
        duplicates = 0
        invalid_categories = 0
        empty_transcripts = 0
        short_transcripts = 0
        
        cat_counts = {}
        
        for idx, item in enumerate(dataset):
            text = item.get("text", "").strip()
            cat = item.get("category", "")
            
            # Check empty
            if not text:
                empty_transcripts += 1
                issues.append(f"Record {idx} (ID: {item.get('id')}): Empty text transcript.")
                continue
                
            # Check length
            if len(text.split()) < 3:
                short_transcripts += 1
                issues.append(f"Record {idx} (ID: {item.get('id')}): Unusually short transcript ({len(text.split())} words).")
                
            # Check duplicates
            text_hash = hashlib.md5(text.lower().encode("utf-8")).hexdigest()
            if text_hash in seen_texts:
                duplicates += 1
                issues.append(f"Record {idx} (ID: {item.get('id')}): Duplicate complaint text.")
            else:
                seen_texts.add(text_hash)
                
            # Check category validity
            if cat not in cls.VALID_CATEGORIES:
                invalid_categories += 1
                issues.append(f"Record {idx} (ID: {item.get('id')}): Invalid category '{cat}' outside Gram Panchayat taxonomy.")
            else:
                cat_counts[cat] = cat_counts.get(cat, 0) + 1
                
        # Class balance ratio
        if cat_counts:
            min_c = min(cat_counts.values())
            max_c = max(cat_counts.values())
            imbalance_ratio = round(max_c / max(1, min_c), 2)
        else:
            imbalance_ratio = 1.0
            
        is_clean = (duplicates == 0 and invalid_categories == 0 and empty_transcripts == 0)
        
        return {
            "dataset_version": DATASET_VERSION,
            "total_records_checked": total,
            "is_clean": is_clean,
            "duplicate_count": duplicates,
            "invalid_category_count": invalid_categories,
            "empty_transcript_count": empty_transcripts,
            "short_transcript_count": short_transcripts,
            "imbalance_ratio": imbalance_ratio,
            "category_distribution": cat_counts,
            "quality_status": "DATASET_CERTIFIED_CLEAN" if is_clean else "DATA_QUALITY_WARNING",
            "issues_logged": issues[:5]
        }


dataset_manager = DatasetManager()
data_quality_engine = DataQualityEngine()

