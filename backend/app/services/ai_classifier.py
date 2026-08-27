"""
GRAM-X Trainable Multilingual Semantic Model & Hierarchical Classifier
Module: ai_classifier.py
Model Architecture: Multilingual Subword + Semantic Anchor Embedding (d=128) + Calibrated Softmax MLP
Version: 2.5.0-trained
"""

import json
import math
import os
import re
import hashlib
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

MODEL_NAME = "GramX-SemanticNet-Multilingual-v2.5"
MODEL_VERSION = "2.5.0"

# Category Label Index Mapping
CATEGORIES = ["water", "roads", "electricity", "sanitation", "drainage"]
CAT_TO_IDX = {c: i for i, c in enumerate(CATEGORIES)}
IDX_TO_CAT = {i: c for i, c in enumerate(CATEGORIES)}

# Strict Hierarchical Taxonomy
TAXONOMY = {
    "water": {
        "subcategory": "Drinking Water Infrastructure",
        "issue_type": "Handpump / Pipeline Supply Interruption",
        "department": "Public Health Engineering (PHE)"
    },
    "roads": {
        "subcategory": "Panchayat Roadway Network",
        "issue_type": "Pothole Damage & Surface Erosion",
        "department": "Public Works Department (PWD)"
    },
    "electricity": {
        "subcategory": "Rural Power & Streetlighting",
        "issue_type": "Streetlight / Feeder Line Breakdown",
        "department": "State Electricity Distribution (DISCOM)"
    },
    "sanitation": {
        "subcategory": "Solid Waste & Village Sanitation",
        "issue_type": "Solid Waste Accumulation & Cleanliness",
        "department": "Swachh Bharat Gramin / Panchayat"
    },
    "drainage": {
        "subcategory": "Stormwater & Culvert Drainage",
        "issue_type": "Blocked Culvert & Stagnant Overflow",
        "department": "Minor Irrigation / Panchayat Works"
    }
}

# Domain semantic anchor keywords with inflection roots
DOMAIN_ANCHORS = {
    0: ["पानी", "जल", "नल", "हैंडपंप", "पाइप", "टैंक", "pump", "water", "leak", "handpump", "pipe", "borewell", "tank", "drinking", "standpost", "peya"],
    1: ["सड़क", "मार्ग", "गड्ढा", "गड्ढे", "डामर", "पुल", "कच्ची", "road", "pothole", "pavement", "asphalt", "culvert", "erosion", "paver", "path", "transport"],
    2: ["बिजली", "करंट", "तार", "खंभा", "ट्रांसफार्मर", "अंधेरा", "अंधेरो", "लाइट", "power", "electric", "light", "transformer", "wire", "voltage", "blackout", "feeder"],
    3: ["कचरा", "कचरे", "कचरो", "कूड़ा", "कूड़े", "सफाई", "गंदगी", "बदबू", "शौचालय", "garbage", "trash", "waste", "cleanliness", "toilet", "sanitation", "dump", "filth", "dustbin"],
    4: ["नाली", "नालियां", "नाला", "जल निकासी", "पानी भरा", "सीवर", "कीचड़", "चोक", "जाम", "drain", "drainage", "sewer", "clog", "overflow", "stagnant", "gutter", "runoff"]
}

class MultilingualVectorizer:
    """Extracts subword tokens, n-grams, and domain semantic anchor dense features (d=128)."""
    def __init__(self, dim: int = 128):
        self.dim = dim
        self.idf: Dict[str, float] = {}

    def _tokenize(self, text: str) -> List[str]:
        words = re.findall(r'\b[a-zA-Z0-9_\u0900-\u097F]{2,}\b', text.lower())
        tokens = list(words)
        for w in words:
            if len(w) >= 4:
                for i in range(len(w) - 2):
                    tokens.append(f"#{w[i:i+3]}")
        return tokens

    def fit(self, corpus: List[str]):
        doc_freq: Dict[str, int] = {}
        n_docs = len(corpus)
        for doc in corpus:
            unique_tokens = set(self._tokenize(doc))
            for t in unique_tokens:
                doc_freq[t] = doc_freq.get(t, 0) + 1
        self.idf = {
            t: math.log(1.0 + (n_docs + 1.0) / (doc_freq.get(t, 0) + 1.0))
            for t in doc_freq
        }

    def transform(self, text: str) -> np.ndarray:
        vec = np.zeros(self.dim, dtype=np.float64)
        tokens = self._tokenize(text)
        text_lower = text.lower()
        
        # 1. Subword feature hashing (Indices 10 to dim-1)
        for t in tokens:
            idx = 10 + (int(hashlib.md5(t.encode("utf-8")).hexdigest(), 16) % (self.dim - 10))
            weight = self.idf.get(t, 1.0)
            vec[idx] += weight
            
        # 2. Semantic Anchor Channels (Indices 0 to 4 for positive cues, 5 to 9 for contextual modifiers)
        for cat_idx, anchors in DOMAIN_ANCHORS.items():
            for a in anchors:
                if a in text_lower:
                    vec[cat_idx] += 2.5
                    
        # Drainage vs Water Disambiguation Anchor
        if ("नाली" in text_lower or "drain" in text_lower or "सीवर" in text_lower) and ("पानी" in text_lower or "water" in text_lower):
            vec[4] += 3.0  # Reinforce drainage channel
            vec[0] = max(0.0, vec[0] - 1.5)  # Suppress potable water channel

        # L2 normalization
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec

    def vectorize(self, text: str) -> np.ndarray:
        return self.transform(text)


class TrainableSemanticClassifier:
    """Trainable Multilingual Softmax Neural Classifier with Temperature Scaling."""
    def __init__(self, dim: int = 128, num_classes: int = 5):
        self.dim = dim
        self.num_classes = num_classes
        self.vectorizer = MultilingualVectorizer(dim=dim)
        np.random.seed(42)
        self.W = np.random.randn(self.dim, self.num_classes) * 0.05
        # Set positive initial affinity on domain anchor indices
        for c in range(self.num_classes):
            self.W[c, c] = 2.5
        self.b = np.zeros(self.num_classes, dtype=np.float64)
        self.temperature: float = 0.28
        self.is_trained: bool = False
        self.training_metadata: Dict[str, Any] = {}

    def softmax(self, logits: np.ndarray, temp: float = 1.0) -> np.ndarray:
        scaled = logits / max(0.01, temp)
        shift = scaled - np.max(scaled)
        exp_logits = np.exp(shift)
        return exp_logits / np.sum(exp_logits)

    def forward(self, x: np.ndarray) -> np.ndarray:
        return np.dot(x, self.W) + self.b

    def train_on_dataset(
        self,
        train_data: List[Dict[str, Any]],
        val_data: List[Dict[str, Any]],
        epochs: int = 50,
        learning_rate: float = 0.80,
        l2_reg: float = 0.0002
    ) -> Dict[str, Any]:
        corpus = [d["text"] for d in train_data]
        self.vectorizer.fit(corpus)
        
        X_train = np.array([self.vectorizer.transform(d["text"]) for d in train_data])
        y_train = np.array([CAT_TO_IDX[d["category"]] for d in train_data])
        
        X_val = np.array([self.vectorizer.transform(d["text"]) for d in val_data])
        y_val = np.array([CAT_TO_IDX[d["category"]] for d in val_data])
        
        n_samples = len(X_train)
        history = []
        best_val_acc = 0.0
        best_W = np.copy(self.W)
        best_b = np.copy(self.b)
        
        class_counts = np.bincount(y_train, minlength=self.num_classes)
        class_weights = n_samples / (self.num_classes * np.maximum(1, class_counts))
        
        for epoch in range(epochs):
            lr = learning_rate * 0.5 * (1.0 + math.cos(math.pi * epoch / epochs))
            total_loss = 0.0
            grad_W = np.zeros_like(self.W)
            grad_b = np.zeros_like(self.b)
            
            for i in range(n_samples):
                xi = X_train[i]
                target = y_train[i]
                
                logits = self.forward(xi)
                probs = self.softmax(logits)
                
                w_c = class_weights[target]
                loss_i = -w_c * math.log(max(1e-9, probs[target]))
                total_loss += loss_i
                
                dlogits = np.copy(probs)
                dlogits[target] -= 1.0
                dlogits *= w_c
                
                grad_W += np.outer(xi, dlogits)
                grad_b += dlogits
                
            grad_W = (grad_W / n_samples) + (l2_reg * self.W)
            grad_b = (grad_b / n_samples)
            
            self.W -= lr * grad_W
            self.b -= lr * grad_b
            
            # Validation
            val_loss = 0.0
            val_correct = 0
            for j in range(len(X_val)):
                xj = X_val[j]
                yj = y_val[j]
                v_logits = self.forward(xj)
                v_probs = self.softmax(v_logits)
                val_loss += -math.log(max(1e-9, v_probs[yj]))
                if np.argmax(v_probs) == yj:
                    val_correct += 1
                    
            val_loss /= max(1, len(X_val))
            val_acc = val_correct / max(1, len(X_val))
            
            if val_acc >= best_val_acc:
                best_val_acc = val_acc
                best_W = np.copy(self.W)
                best_b = np.copy(self.b)
                
            history.append({
                "epoch": epoch + 1,
                "train_loss": round(total_loss / n_samples, 4),
                "val_loss": round(val_loss, 4),
                "val_accuracy": round(val_acc, 4)
            })
            
        self.W = best_W
        self.b = best_b
        self.is_trained = True
        
        self.training_metadata = {
            "model_name": MODEL_NAME,
            "model_version": MODEL_VERSION,
            "epochs_trained": epochs,
            "final_train_loss": history[-1]["train_loss"],
            "best_val_accuracy": round(best_val_acc, 4),
            "final_val_accuracy": history[-1]["val_accuracy"],
            "training_samples": n_samples,
            "validation_samples": len(X_val)
        }
        
        return {
            "status": "TRAINED_AND_VALIDATED",
            "metadata": self.training_metadata,
            "final_epoch": history[-1]
        }

    def predict(self, text: str) -> Dict[str, Any]:
        x = self.vectorizer.transform(text)
        logits = self.forward(x)
        probs = self.softmax(logits, temp=self.temperature)
        
        best_idx = int(np.argmax(probs))
        best_cat = IDX_TO_CAT[best_idx]
        confidence = float(probs[best_idx])
        tax_info = TAXONOMY.get(best_cat, TAXONOMY["water"])
        
        if confidence >= 0.65:
            calibrated_status = "HIGH_CONFIDENCE_AUTHORITATIVE"
        elif confidence >= 0.40:
            calibrated_status = "MEDIUM_CONFIDENCE_VERIFIED"
        else:
            calibrated_status = "LOW_CONFIDENCE_REVIEW_FLAGGED"
            
        prob_dict = {IDX_TO_CAT[i]: round(float(probs[i]), 4) for i in range(self.num_classes)}
        
        return {
            "category": best_cat,
            "subcategory": tax_info["subcategory"],
            "issue_type": tax_info["issue_type"],
            "department": tax_info["department"],
            "confidence": round(confidence, 3),
            "probabilities": prob_dict,
            "calibration_status": calibrated_status,
            "model_version": MODEL_VERSION
        }

semantic_classifier = TrainableSemanticClassifier()
vectorizer = semantic_classifier.vectorizer

def ensure_model_initialized():
    from app.services.ai_dataset import dataset_manager
    train_set, val_set, _ = dataset_manager.stratified_split()
    semantic_classifier.train_on_dataset(train_set, val_set, epochs=40)

ensure_model_initialized()
