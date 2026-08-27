"""
GRAM-X AI 3.0: Baseline Evaluation & Model Benchmarking Engine
Module: ai_baseline.py
"""

import time
import math
import numpy as np
from typing import Dict, Any, List, Tuple
from app.services.ai_dataset import dataset_manager, GOLD_COMPLAINT_DATASET
from app.services.ai_classifier import CATEGORIES, CAT_TO_IDX, IDX_TO_CAT, TAXONOMY

class RuleBaselineClassifier:
    """Heuristic / Token-matching baseline model."""
    def predict(self, text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        if "पानी" in text_lower or "pump" in text_lower or "water" in text_lower:
            return {"category": "water", "confidence": 0.65}
        if "सड़क" in text_lower or "road" in text_lower or "गड्ढा" in text_lower:
            return {"category": "roads", "confidence": 0.65}
        if "बिजली" in text_lower or "light" in text_lower or "wire" in text_lower:
            return {"category": "electricity", "confidence": 0.65}
        if "कचरा" in text_lower or "garbage" in text_lower or "सफाई" in text_lower:
            return {"category": "sanitation", "confidence": 0.65}
        if "नाली" in text_lower or "drain" in text_lower or "सीवर" in text_lower:
            return {"category": "drainage", "confidence": 0.65}
        return {"category": "water", "confidence": 0.20}


class TFIDFBaselineClassifier:
    """Linear unigram TF-IDF baseline model."""
    def __init__(self):
        self.vocab: Dict[str, int] = {}
        self.W = np.zeros((100, 5))
        
    def fit(self, samples: List[Dict[str, Any]]):
        idx = 0
        for s in samples:
            for w in s["text"].lower().split():
                if w not in self.vocab and idx < 100:
                    self.vocab[w] = idx
                    idx += 1
                    
        for s in samples:
            c_idx = CAT_TO_IDX[s["category"]]
            for w in s["text"].lower().split():
                if w in self.vocab:
                    self.W[self.vocab[w], c_idx] += 1.0
                    
        # Normalize weights safely
        col_norms = np.linalg.norm(self.W, axis=0, keepdims=True)
        self.W = np.divide(self.W, col_norms, out=np.zeros_like(self.W), where=col_norms > 0)

    def predict(self, text: str) -> Dict[str, Any]:
        vec = np.zeros(100)
        for w in text.lower().split():
            if w in self.vocab:
                vec[self.vocab[w]] += 1.0
        scores = np.dot(vec, self.W)
        best = int(np.argmax(scores)) if np.sum(scores) > 0 else 0
        return {"category": IDX_TO_CAT[best], "confidence": 0.60}


class AIBaselineEvaluator:
    """Evaluates and compares candidate models against frozen baselines."""
    def __init__(self):
        self.rule_baseline = RuleBaselineClassifier()
        self.tfidf_baseline = TFIDFBaselineClassifier()
        self.tfidf_baseline.fit(GOLD_COMPLAINT_DATASET[:30])

    def compute_metrics(self, y_true: List[str], y_pred: List[str], latencies_ms: List[float]) -> Dict[str, Any]:
        n = len(y_true)
        if n == 0:
            return {}
            
        # Confusion matrix (5x5)
        cm = np.zeros((5, 5), dtype=int)
        for t, p in zip(y_true, y_pred):
            cm[CAT_TO_IDX[t], CAT_TO_IDX[p]] += 1
            
        # Precision, Recall, F1 per class
        per_class = {}
        precisions = []
        recalls = []
        f1s = []
        
        for i, cat in enumerate(CATEGORIES):
            tp = cm[i, i]
            fp = np.sum(cm[:, i]) - tp
            fn = np.sum(cm[i, :]) - tp
            
            p = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            r = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            f1 = 2 * (p * r) / (p + r) if (p + r) > 0 else 0.0
            
            precisions.append(p)
            recalls.append(r)
            f1s.append(f1)
            
            per_class[cat] = {
                "precision": round(p, 3),
                "recall": round(r, 3),
                "f1_score": round(f1, 3),
                "support": int(np.sum(cm[i, :]))
            }
            
        accuracy = round(float(np.trace(cm) / n), 3)
        macro_p = round(float(np.mean(precisions)), 3)
        macro_r = round(float(np.mean(recalls)), 3)
        macro_f1 = round(float(np.mean(f1s)), 3)
        
        # Latency percentiles
        p50 = round(float(np.percentile(latencies_ms, 50)), 2) if latencies_ms else 0.0
        p95 = round(float(np.percentile(latencies_ms, 95)), 2) if latencies_ms else 0.0
        p99 = round(float(np.percentile(latencies_ms, 99)), 2) if latencies_ms else 0.0
        
        return {
            "sample_count": n,
            "accuracy": accuracy,
            "macro_precision": macro_p,
            "macro_recall": macro_r,
            "macro_f1": macro_f1,
            "per_category_metrics": per_class,
            "confusion_matrix": cm.tolist(),
            "latency_p50_ms": p50,
            "latency_p95_ms": p95,
            "latency_p99_ms": p99
        }

    def evaluate_all(self, test_set: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Evaluates Rule Baseline, TF-IDF Baseline, and Production Semantic Classifier."""
        from app.services.ai_classifier import semantic_classifier
        eval_data = test_set or GOLD_COMPLAINT_DATASET
        y_true = [d["category"] for d in eval_data]
        
        # 1. Rule baseline
        rule_preds = []
        rule_times = []
        for d in eval_data:
            t0 = time.time()
            res = self.rule_baseline.predict(d["text"])
            rule_times.append((time.time() - t0) * 1000.0)
            rule_preds.append(res["category"])
        rule_metrics = self.compute_metrics(y_true, rule_preds, rule_times)
        
        # 2. TF-IDF baseline
        tfidf_preds = []
        tfidf_times = []
        for d in eval_data:
            t0 = time.time()
            res = self.tfidf_baseline.predict(d["text"])
            tfidf_times.append((time.time() - t0) * 1000.0)
            tfidf_preds.append(res["category"])
        tfidf_metrics = self.compute_metrics(y_true, tfidf_preds, tfidf_times)
        
        # 3. Production Semantic Classifier
        prod_preds = []
        prod_times = []
        for d in eval_data:
            t0 = time.time()
            res = semantic_classifier.predict(d["text"])
            prod_times.append((time.time() - t0) * 1000.0)
            prod_preds.append(res["category"])
        prod_metrics = self.compute_metrics(y_true, prod_preds, prod_times)
        
        return {
            "evaluation_dataset_version": dataset_manager.version,
            "total_test_samples": len(eval_data),
            "baselines": {
                "rule_heuristic_baseline": {
                    "architecture": "Deterministic Keyword / Token Pattern Matching",
                    "metrics": rule_metrics
                },
                "tfidf_linear_baseline": {
                    "architecture": "Sparse TF-IDF Bag-of-Words Linear Classifier",
                    "metrics": tfidf_metrics
                },
                "gramx_semantic_production_model": {
                    "architecture": "Subword Dense Embedding (d=128) + Calibrated Softmax MLP",
                    "model_version": semantic_classifier.training_metadata.get("model_version", "3.0.0"),
                    "metrics": prod_metrics
                }
            }
        }


# Global singleton instance
ai_baseline_evaluator = AIBaselineEvaluator()
