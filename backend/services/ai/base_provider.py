from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional


@dataclass
class TranscriptSegment:
    id: str
    start: float
    end: float
    text: str
    speaker: Optional[str] = None
    speakerRole: Optional[str] = None
    confidence: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "start": round(self.start, 2),
            "end": round(self.end, 2),
            "text": self.text.strip(),
            "speaker": self.speaker,
            "speakerRole": self.speakerRole,
            "confidence": round(self.confidence, 3) if self.confidence is not None else None,
        }


@dataclass
class TranscriptionResult:
    transcript_text: str
    segments: List[TranscriptSegment] = field(default_factory=list)
    duration_seconds: float = 0.0
    processing_duration_ms: int = 0
    language: str = "es"
    model_name: str = "base"
    provider_name: str = "local_whisper"


@dataclass
class ProviderStatus:
    available: bool
    provider_name: str
    model_name: str
    details: str
    ffmpeg_available: bool
    error: Optional[str] = None


class TranscriptionProvider(ABC):
    @abstractmethod
    async def transcribe(
        self,
        audio_path: Path,
        language: Optional[str] = None,
        task: str = "transcribe",
    ) -> TranscriptionResult:
        """Executes audio transcription and returns normalized result."""
        pass

    @abstractmethod
    def check_availability(self) -> ProviderStatus:
        """Inspects runtime health and dependency availability."""
        pass
