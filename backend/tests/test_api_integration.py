import io
from unittest.mock import AsyncMock, patch
from backend.services.ai.base_provider import TranscriptSegment, TranscriptionResult


def test_full_audio_upload_transcription_and_export_flow(client):
    # 1. Register customer
    reg_payload = {
        "first_name": "Andrey",
        "last_name": "Quiceno",
        "email": "e2e.andrey@clustlayer.com",
        "password": "Password123!",
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_payload["email"] == reg_res.json()["user"]["email"]
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Mock provider to return deterministic TranscriptionResult
    mock_result = TranscriptionResult(
        transcript_text="Evaluación formal del trimestre Q3. El objetivo es evaluar el rendimiento de inferencia.",
        segments=[
            TranscriptSegment(
                id="seg-1",
                start=0.0,
                end=5.5,
                text="Evaluación formal del trimestre Q3.",
                speaker="Andrey Quiceno",
                speakerRole="Director de IA",
                confidence=0.995,
            ),
            TranscriptSegment(
                id="seg-2",
                start=5.6,
                end=12.2,
                text="El objetivo es evaluar el rendimiento de inferencia.",
                speaker="Andrey Quiceno",
                speakerRole="Director de IA",
                confidence=0.992,
            ),
        ],
        duration_seconds=12.2,
        processing_duration_ms=480,
        language="es",
        model_name="base",
        provider_name="local_whisper",
    )

    # Minimal WAV bytes: 44 bytes header + sample data
    wav_bytes = (
        b"RIFF\x2c\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00"
        b"\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x08\x00\x00\x00"
        b"\x00\x00\x00\x00\x00\x00\x00\x00"
    )

    with patch(
        "backend.services.ai.local_whisper_provider.LocalWhisperProvider.transcribe",
        new_callable=AsyncMock,
        return_value=mock_result,
    ):
        upload_res = client.post(
            "/api/v1/transcriptions/upload",
            headers=headers,
            files={"file": ("auditoria_trimestral.wav", io.BytesIO(wav_bytes), "audio/wav")},
            data={"language": "es"},
        )
        assert upload_res.status_code == 201
        data = upload_res.json()
        transcription_id = data["transcription"]["id"]
        conv_id = data["conversation_id"]
        assert data["transcription"]["status"] == "completed"
        assert "Evaluación formal" in data["transcription"]["transcript_text"]
        assert len(data["transcription"]["segments"]) == 2

    # 3. Check conversation detail contains assistant message
    conv_detail = client.get(f"/api/v1/conversations/{conv_id}", headers=headers)
    assert conv_detail.status_code == 200
    messages = conv_detail.json()["messages"]
    assert len(messages) >= 2  # user request message + assistant transcription message
    assert messages[-1]["role"] == "assistant"
    assert "Evaluación formal" in messages[-1]["content"]

    # 4. Export transcription in formats
    # TXT
    export_txt = client.get(f"/api/v1/transcriptions/{transcription_id}/export?format=txt", headers=headers)
    assert export_txt.status_code == 200
    assert "Evaluación formal" in export_txt.text

    # SRT
    export_srt = client.get(f"/api/v1/transcriptions/{transcription_id}/export?format=srt", headers=headers)
    assert export_srt.status_code == 200
    assert "-->" in export_srt.text

    # VTT
    export_vtt = client.get(f"/api/v1/transcriptions/{transcription_id}/export?format=vtt", headers=headers)
    assert export_vtt.status_code == 200
    assert "WEBVTT" in export_vtt.text

    # JSON
    export_json = client.get(f"/api/v1/transcriptions/{transcription_id}/export?format=json", headers=headers)
    assert export_json.status_code == 200
    assert "segments" in export_json.text

    # 5. Create note linked to this transcription
    note_res = client.post(
        "/api/v1/notes",
        headers=headers,
        json={
            "conversation_id": conv_id,
            "transcription_id": transcription_id,
            "title": "Aprobación Q3",
            "content": "Objetivo de inferencia cumplido con éxito.",
            "category": "Resumen Ejecutivo",
            "segment_start": 0.0,
            "segment_end": 5.5,
        },
    )
    assert note_res.status_code == 201

    # 6. Check Usage Summary reflects audio minutes
    usage_res = client.get("/api/v1/usage/summary", headers=headers)
    assert usage_res.status_code == 200
    u_data = usage_res.json()
    assert u_data["total_requests"] >= 1
    assert u_data["total_audio_seconds"] >= 12.0
