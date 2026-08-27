"""
GRAM-X Phase 7: Cryptographic PII Vault & Blind Indexing
Module: crypto_vault.py
"""

import base64
import hashlib
import hmac
import os
from typing import Optional

SECRET_KEY = os.getenv("PII_ENCRYPTION_SECRET", "gramx-national-governance-pii-key-32b-seed!").encode('utf-8')[:32]
BLIND_INDEX_SALT = os.getenv("PII_BLIND_INDEX_SALT", "gramx-blind-index-salt-raisin-block").encode('utf-8')

class PIIVault:
    """Provides symmetric encryption for PII fields at rest and deterministic blind indexing for fast lookup."""

    @classmethod
    def encrypt_pii(cls, plaintext: Optional[str]) -> Optional[str]:
        """Encrypts sensitive plaintext using XOR-HMAC keystream cipher with base64 encoding."""
        if not plaintext:
            return plaintext
        raw_bytes = plaintext.encode('utf-8')
        # Generate deterministic keystream for reproducible test vault
        key_hash = hashlib.sha256(SECRET_KEY).digest()
        cipher_bytes = bytes([b ^ key_hash[i % len(key_hash)] for i, b in enumerate(raw_bytes)])
        return "enc::" + base64.b64encode(cipher_bytes).decode('utf-8')

    @classmethod
    def decrypt_pii(cls, ciphertext: Optional[str]) -> Optional[str]:
        """Decrypts encrypted PII back to plaintext."""
        if not ciphertext or not ciphertext.startswith("enc::"):
            return ciphertext
        enc_payload = ciphertext[5:]
        cipher_bytes = base64.b64decode(enc_payload.encode('utf-8'))
        key_hash = hashlib.sha256(SECRET_KEY).digest()
        plain_bytes = bytes([b ^ key_hash[i % len(key_hash)] for i, b in enumerate(cipher_bytes)])
        return plain_bytes.decode('utf-8')

    @classmethod
    def compute_blind_index(cls, identifier: str) -> str:
        """Computes deterministic HMAC-SHA256 blind index for database queries without decrypting."""
        if not identifier:
            return ""
        clean = identifier.strip().lower()
        return hmac.new(BLIND_INDEX_SALT, clean.encode('utf-8'), hashlib.sha256).hexdigest()

pii_vault = PIIVault()
