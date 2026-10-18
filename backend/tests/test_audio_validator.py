import pytest
from backend.core.exceptions import BusinessRuleViolationException
from backend.services.transcription.audio_validator import (
    sanitize_filename,
    validate_audio_file,
    verify_magic_bytes,
)


def test_sanitize_filename_prevents_path_traversal():
    malicious = "../../../etc/passwd.wav"
    clean = sanitize_filename(malicious)
    assert "/" not in clean
    assert "\\" not in clean
    assert ".." not in clean
    assert clean.endswith(".wav")


def test_verify_magic_bytes_supported_formats():
    assert verify_magic_bytes(b"RIFF\x24\x00\x00\x00WAVE") == "wav"
    assert verify_magic_bytes(b"ID3\x04\x00\x00\x00") == "mp3"
    assert verify_magic_bytes(b"\x00\x00\x00\x20ftypM4A ") == "m4a"
    assert verify_magic_bytes(b"fLaC\x00\x00\x00\x22") == "flac"
    assert verify_magic_bytes(b"OggS\x00\x02\x00\x00") == "ogg"


def test_verify_magic_bytes_rejects_executable_or_text():
    with pytest.raises(BusinessRuleViolationException):
        verify_magic_bytes(b"MZ\x90\x00\x03\x00\x00\x00")  # Windows PE executable

    with pytest.raises(BusinessRuleViolationException):
        verify_magic_bytes(b"<html><head><script>")


def test_validate_audio_file_empty_fails():
    with pytest.raises(BusinessRuleViolationException) as exc:
        validate_audio_file(content=b"", original_filename="empty.wav")
    assert exc.value.code == "EMPTY_FILE"


def test_validate_audio_file_too_large_fails():
    large_bytes = b"RIFF" + b"\x00" * 1024
    with pytest.raises(BusinessRuleViolationException) as exc:
        validate_audio_file(
            content=large_bytes,
            original_filename="large.wav",
            max_size_bytes=512,
        )
    assert exc.value.code == "FILE_TOO_LARGE"


def test_validate_audio_file_unsupported_extension_fails():
    with pytest.raises(BusinessRuleViolationException) as exc:
        validate_audio_file(
            content=b"RIFF\x24\x00\x00\x00WAVE",
            original_filename="script.sh",
        )
    assert exc.value.code == "UNSUPPORTED_EXTENSION"


def test_validate_audio_file_success():
    # Minimal WAV bytes: 44 bytes header + sample data
    wav_header = (
        b"RIFF\x2c\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00"
        b"\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x08\x00\x00\x00"
        b"\x00\x00\x00\x00\x00\x00\x00\x00"
    )
    clean_name, fmt, duration, checksum = validate_audio_file(
        content=wav_header,
        original_filename="sample_audio.wav",
        max_duration_seconds=120,
    )
    assert fmt == "wav"
    assert clean_name == "sample_audio.wav"
    assert len(checksum) == 64
