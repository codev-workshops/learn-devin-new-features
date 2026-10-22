"""PayGate webhook signatures: ``X-PayGate-Signature: sha256=<hex HMAC-SHA256 of the raw body>``.

The worker's own inbox verifies signatures properly; the unverified-signature plant lives in
``services/api`` (W1-api), not here.
"""

from __future__ import annotations

import hashlib
import hmac


def sign(secret: str, raw_body: bytes) -> str:
    digest = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


def verify(secret: str, raw_body: bytes, header: str | None) -> bool:
    if not header or not header.startswith("sha256="):
        return False
    return hmac.compare_digest(sign(secret, raw_body), header.strip())
