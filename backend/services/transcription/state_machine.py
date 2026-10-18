from enum import Enum
from typing import Set
from backend.core.exceptions import BusinessRuleViolationException


class TranscriptionState(str, Enum):
    PENDING = "pending"
    VALIDATING = "validating"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


VALID_TRANSITIONS = {
    TranscriptionState.PENDING: {
        TranscriptionState.VALIDATING,
        TranscriptionState.FAILED,
        TranscriptionState.CANCELLED,
    },
    TranscriptionState.VALIDATING: {
        TranscriptionState.PROCESSING,
        TranscriptionState.FAILED,
        TranscriptionState.CANCELLED,
    },
    TranscriptionState.PROCESSING: {
        TranscriptionState.COMPLETED,
        TranscriptionState.FAILED,
        TranscriptionState.CANCELLED,
    },
    TranscriptionState.COMPLETED: set(),  # Terminal state
    TranscriptionState.FAILED: set(),     # Terminal state
    TranscriptionState.CANCELLED: set(),  # Terminal state
}


def transition_state(current_state: str, new_state: str) -> str:
    """Validates state machine transitions, preventing invalid or race condition states."""
    try:
        curr = TranscriptionState(current_state)
        nxt = TranscriptionState(new_state)
    except ValueError as e:
        raise BusinessRuleViolationException(f"Estado de transcripción no válido: {e}", code="INVALID_STATE")

    allowed: Set[TranscriptionState] = VALID_TRANSITIONS.get(curr, set())
    if nxt not in allowed:
        raise BusinessRuleViolationException(
            f"Transición de estado no permitida: '{curr.value}' -> '{nxt.value}'",
            code="INVALID_STATE_TRANSITION",
        )
    return nxt.value
