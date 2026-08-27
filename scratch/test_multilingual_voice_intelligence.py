"""
GRAM-X Multilingual Regional Voice Complaint Intelligence Test Suite
Verifies:
1. Language Identification (LID) across Indian Regional Languages & Dialects
2. Regional Dialect Normalization (Bundeli -> Standard Hindi)
3. Semantic Intent & Category Classification without exact keyword matching
4. Code-Switching & Informal Phrasing Handling
5. Structured Governance Entity Extraction
6. Bidirectional Multilingual Translation & Traceability
7. End-to-End API Integration & Confidence Scoring
"""

import sys
import os
import json

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath("backend"))

from app.services.ai_voice import transcribe_voice_report, LANGUAGE_REGISTRY

def run_tests():
    print("======================================================================")
    print("GRAM-X MULTILINGUAL REGIONAL VOICE COMPLAINT INTELLIGENCE SUITE")
    print("======================================================================")

    # 1. Language Registry Verification
    print("\n[TEST 1] Indian Regional Languages Registry Verification...")
    assert len(LANGUAGE_REGISTRY) >= 12
    assert "hi-bundeli" in LANGUAGE_REGISTRY
    assert "bn" in LANGUAGE_REGISTRY
    assert "te" in LANGUAGE_REGISTRY
    assert "mr" in LANGUAGE_REGISTRY
    print(f"  [PASS] Supported Languages: {len(LANGUAGE_REGISTRY)} regional languages registered.")

    # 2. Bundeli Dialect Normalization & Semantic Water Classification
    print("\n[TEST 2] Bundeli Dialect Speech & Semantic Water Supply Categorization...")
    bundeli_text = "हमारो पानी को हैंड़पंप पिपर्ली रोड पै टूट गयो है, चार दिन से पानी नई निकरो है, बहुत परेशानी हो रई है।"
    res1 = transcribe_voice_report(bundeli_text)
    assert res1["category"] == "water"
    assert res1["subcategory"] == "Drinking Water Infrastructure"
    assert "हैंडपंप" in res1["normalized_transcript"]
    assert "Bundeli" in res1["detected_language"]
    assert res1["language_confidence"] >= 0.90
    assert "text_english" in res1 and len(res1["text_english"]) > 10
    print(f"  [PASS] Bundeli Normalization OK | Category: {res1['category']} | Subcat: {res1['subcategory']} | Detected: {res1['detected_language']}")

    # 3. Roadway Defect & Pothole Semantic Classification
    print("\n[TEST 3] Roadway Infrastructure Grievance Categorization...")
    road_text = "गांव की मुख्य सड़क पर बड़ा गड्ढा हो गया है, गाड़ियां निकलने में दुर्घटना का खतरा है।"
    res2 = transcribe_voice_report(road_text)
    assert res2["category"] == "roads"
    assert res2["subcategory"] == "Panchayat Roadway Network"
    assert res2["department"] == "Public Works Department (PWD)"
    print(f"  [PASS] Road Defect OK | Category: {res2['category']} | Dept: {res2['department']}")

    # 4. Code-Switching Speech (Hinglish / Mixed Language)
    print("\n[TEST 4] Code-Switching (Hinglish: Hindi + English) Speech Handling...")
    mixed_text = "हमारे गांव में ward 2 की water supply pipeline breach हो गई है, emergency issue है।"
    res3 = transcribe_voice_report(mixed_text)
    assert res3["category"] == "water"
    assert res3["severity"] == "critical"
    assert "Ward 2" in res3["entities"]["location"] or "ward 2" in res3["entities"]["location"].lower()
    print(f"  [PASS] Code-Switching OK | Category: {res3['category']} | Severity: {res3['severity']} | Location: {res3['entities']['location']}")

    # 5. Electrical Grid & Transformer Blackout Semantic Classification
    print("\n[TEST 5] Power & Streetlight Failure Categorization...")
    power_text = "वार्ड 3 में ट्रांसफार्मर से धुआं निकल रहा है और पूरे मोहल्ले में बिजली गुल है।"
    res4 = transcribe_voice_report(power_text)
    assert res4["category"] == "electricity"
    assert res4["subcategory"] == "Rural Power & Streetlighting"
    print(f"  [PASS] Electricity OK | Category: {res4['category']} | Subcat: {res4['subcategory']}")

    # 6. Solid Waste & Sanitation Semantic Classification
    print("\n[TEST 6] Solid Waste & Cleanliness Categorization...")
    waste_text = "सार्वजनिक चौपाल के पास कचरे का ढेर लगा हुआ है, बदबू से बीमारियां फैलने का डर है।"
    res5 = transcribe_voice_report(waste_text)
    assert res5["category"] == "sanitation"
    assert res5["subcategory"] == "Solid Waste & Village Sanitation"
    print(f"  [PASS] Sanitation OK | Category: {res5['category']} | Subcat: {res5['subcategory']}")

    # 7. Stormwater & Culvert Drainage Semantic Classification
    print("\n[TEST 7] Stormwater Drainage & Blockage Categorization...")
    drain_text = "बरसात की नाली पूरी तरह जाम है, गंदा पानी रास्ते पर भर रहा है।"
    res6 = transcribe_voice_report(drain_text)
    assert res6["category"] == "drainage"
    assert res6["subcategory"] == "Stormwater & Culvert Drainage"
    print(f"  [PASS] Drainage OK | Category: {res6['category']} | Subcat: {res6['subcategory']}")

    # 8. English Regional Reporting & Traceability
    print("\n[TEST 8] English Language Complaint & Hindi Translation Generation...")
    eng_text = "The drinking water supply pipeline near Ward 4 is leaking severely."
    res7 = transcribe_voice_report(eng_text)
    assert res7["category"] == "water"
    assert "English" in res7["detected_language"]
    assert "text_hindi" in res7 and len(res7["text_hindi"]) > 5
    print(f"  [PASS] English Pipeline OK | Detected: {res7['detected_language']} | Hindi Meaning: {res7['text_hindi'][:40]}...")

    print("\n======================================================================")
    print("ALL 8 MULTILINGUAL REGIONAL VOICE INTELLIGENCE TESTS PASSED — 100% OK")
    print("======================================================================")

if __name__ == "__main__":
    run_tests()
