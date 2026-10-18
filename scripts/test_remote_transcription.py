"""One-shot local check: remote transcription via configured .env (no secrets printed)."""
from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

import httpx
import truststore

truststore.inject_into_ssl()

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.core.security import create_access_token  # noqa: E402


def main() -> None:
    db = sqlite3.connect(ROOT / "voznotai-local.db")
    row = db.execute(
        "SELECT id FROM users WHERE email = ? LIMIT 1",
        ("jhorman.gomez@clustlayer.com",),
    ).fetchone()
    if not row:
        raise SystemExit("Usuario de prueba no encontrado en la base local.")
    token = create_access_token(row[0], "customer")
    wav = next((ROOT / "uploads").glob("*.wav"))
    client = httpx.Client(base_url="http://127.0.0.1:8000", timeout=120.0)
    with wav.open("rb") as handle:
        response = client.post(
            "/api/v1/transcriptions/upload",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": (wav.name, handle, "audio/wav")},
        )
    print("status", response.status_code)
    if response.status_code != 201:
        print(response.text[:500])
        raise SystemExit(1)
    payload = response.json()["transcription"]
    print("provider", payload.get("provider"))
    print("model", payload.get("model_name"))
    text = (payload.get("transcript_text") or "").strip()
    print("text_chars", len(text))


if __name__ == "__main__":
    main()
