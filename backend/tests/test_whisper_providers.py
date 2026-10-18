import pytest
from backend.core.exceptions import (
    SSRFDetectedException,
    TranscriptionProviderException,
)
from backend.models.system_settings import SystemSettings
from backend.services.ai.local_whisper_provider import LocalWhisperProvider
from backend.services.ai.provider_factory import ProviderFactory
from backend.services.ai.remote_provider import (
    RemoteTranscriptionProvider,
    validate_remote_url,
)


def test_local_whisper_check_availability():
    provider = LocalWhisperProvider(model_name="base")
    status = provider.check_availability()
    assert status.provider_name == "local_whisper"
    assert status.model_name == "base"
    # Status reports real status without faking


def test_remote_provider_ssrf_protection_blocks_localhost():
    with pytest.raises(SSRFDetectedException):
        validate_remote_url("http://localhost:8080/v1/audio", allow_local_for_testing=False)

    with pytest.raises(SSRFDetectedException):
        validate_remote_url("http://127.0.0.1:8000/v1", allow_local_for_testing=False)

    with pytest.raises(SSRFDetectedException):
        validate_remote_url("http://169.254.169.254/latest/meta-data/", allow_local_for_testing=False)

    with pytest.raises(SSRFDetectedException):
        validate_remote_url("file:///etc/passwd")


def test_remote_provider_valid_url_accepted():
    validate_remote_url("https://api.openai.com/v1", allow_local_for_testing=False)


def test_provider_factory_local_selection(db_session):
    sys_settings = db_session.query(SystemSettings).first()
    sys_settings.execution_mode = "local"
    sys_settings.local_model_name = "base"
    db_session.commit()

    provider = ProviderFactory.get_provider(db_session)
    assert isinstance(provider, LocalWhisperProvider)
    assert provider.model_name == "base"


def test_provider_factory_api_unconfigured_raises_error_not_silent_fallback(db_session):
    sys_settings = db_session.query(SystemSettings).first()
    sys_settings.execution_mode = "api"
    sys_settings.remote_provider_enabled = False
    db_session.commit()

    # Must raise error explaining that API is unconfigured, not fall back silently to local!
    with pytest.raises(TranscriptionProviderException) as exc:
        ProviderFactory.get_provider(db_session)
    assert exc.value.status_code == 502
    assert "API_PROVIDER_NOT_CONFIGURED" in str(exc.value.detail)
