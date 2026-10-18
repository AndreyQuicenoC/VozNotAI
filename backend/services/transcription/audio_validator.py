import hashlib
import os
import re
import struct
import wave
from pathlib import Path
from typing import Tuple
from backend.core.config import get_settings
from backend.core.exceptions import BusinessRuleViolationException

settings = get_settings()

MAGIC_SIGNATURES = {
    "wav": [b"RIFF"],
    "mp3": [b"ID3", b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"],
    "m4a": [b"ftyp"],
    "flac": [b"fLaC"],
    "ogg": [b"OggS"],
}


def sanitize_filename(filename: str) -> str:
    """Sanitizes filename, stripping directory traversal characters and unsafe symbols."""
    clean = os.path.basename(filename)
    clean = re.sub(r"[^\w\.\-\_]", "_", clean)
    if not clean:
        clean = "audio_upload.wav"
    return clean


def verify_magic_bytes(header: bytes) -> str:
    """Verifies file header against allowed audio magic bytes."""
    for fmt, signatures in MAGIC_SIGNATURES.items():
        for sig in signatures:
            if fmt == "m4a":
                # In MP4/M4A, ftyp typically appears at offset 4
                if len(header) >= 8 and header[4:8] == b"ftyp":
                    return fmt
            elif header.startswith(sig):
                return fmt
    raise BusinessRuleViolationException(
        "El contenido del archivo no coincide con ningún formato de audio permitido (WAV, MP3, M4A, FLAC, OGG).",
        code="INVALID_AUDIO_CONTENT",
    )


def get_wav_duration(path: Path) -> float:
    """Extracts exact duration from standard WAV files using Python's standard wave library."""
    try:
        with wave.open(str(path), "rb") as wf:
            frames = wf.getnframes()
            rate = wf.getframerate()
            if rate > 0:
                return float(frames / float(rate))
    except Exception:
        pass
    return 0.0


def validate_audio_file(
    content: bytes,
    original_filename: str,
    max_duration_seconds: int = 120,
    max_size_bytes: int = 26214400,
) -> Tuple[str, str, float, str]:
    """
    Validates uploaded audio file:
    - Size <= max_size_bytes
    - Extension check
    - Real magic bytes inspection
    - Computes SHA-256 checksum
    Returns: (sanitized_name, format, estimated_duration, sha256_checksum)
    """
    file_size = len(content)
    if file_size == 0:
        raise BusinessRuleViolationException("El archivo de audio está vacío (0 bytes).", code="EMPTY_FILE")

    if file_size > max_size_bytes:
        max_mb = max_size_bytes / (1024 * 1024)
        raise BusinessRuleViolationException(
            f"El archivo excede el tamaño máximo permitido de {max_mb:.1f} MB.",
            code="FILE_TOO_LARGE",
        )

    clean_name = sanitize_filename(original_filename)
    ext = Path(clean_name).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise BusinessRuleViolationException(
            f"Extensión '{ext}' no permitida. Formatos soportados: {', '.join(settings.ALLOWED_EXTENSIONS)}",
            code="UNSUPPORTED_EXTENSION",
        )

    # Magic byte verification
    header = content[:32]
    detected_format = verify_magic_bytes(header)

    # Checksum calculation
    checksum = hashlib.sha256(content).hexdigest()

    # Duration check (for WAV headers directly, approximate or standard check)
    duration = 0.0
    if detected_format == "wav" and len(content) > 44:
        try:
            # WAV fmt header: channels at offset 22 (2 bytes), sample rate at offset 24 (4 bytes), byte rate at offset 28 (4 bytes)
            byte_rate = struct.unpack("<I", content[28:32])[0]
            data_size = file_size - 44
            if byte_rate > 0:
                duration = float(data_size) / float(byte_rate)
        except Exception:
            duration = 0.0

    if duration > 0 and duration > (max_duration_seconds + 5):  # allow small tolerance
        raise BusinessRuleViolationException(
            f"La duración del audio ({duration:.1f}s) excede el límite máximo permitido de {max_duration_seconds} segundos.",
            code="AUDIO_DURATION_EXCEEDED",
        )

    return clean_name, detected_format, duration, checksum
