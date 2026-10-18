from decimal import Decimal
from backend.core.security import create_access_token
from backend.models.usage_event import UsageEvent


def test_usage_summary_and_exact_decimal_calculation(client, customer_user_a, db_session):
    # Seed 2 usage events for User A
    # Event 1: 120 seconds local -> 2 minutes at 0.006 = 0.0120 USD estimated, actual None
    ev1 = UsageEvent(
        owner_user_id=customer_user_a.id,
        provider="local_whisper",
        model_name="base",
        execution_mode="local",
        audio_duration_seconds=120.0,
        processing_duration_ms=4500,
        estimated_cost_usd=Decimal("0.0120"),
        actual_cost_usd=None,
        cost_source="configured_rate",
        status="completed",
    )
    # Event 2: 180 seconds remote -> 3 minutes at 0.006 = 0.0180 USD estimated, 0.0180 actual
    ev2 = UsageEvent(
        owner_user_id=customer_user_a.id,
        provider="remote_api",
        model_name="whisper-1",
        execution_mode="api",
        audio_duration_seconds=180.0,
        processing_duration_ms=2100,
        estimated_cost_usd=Decimal("0.0180"),
        actual_cost_usd=Decimal("0.0180"),
        cost_source="provider_reported",
        status="completed",
    )
    db_session.add_all([ev1, ev2])
    db_session.commit()

    token = create_access_token(customer_user_a.id, customer_user_a.role)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/usage/summary", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["total_audio_seconds"] == 300.0
    assert data["total_audio_minutes"] == 5.0
    assert data["total_requests"] == 2
    # Exact Decimal cost check
    assert Decimal(str(data["estimated_cost_usd"])) == Decimal("0.0300")
    assert Decimal(str(data["actual_cost_usd"])) == Decimal("0.0180")
    assert data["local_audio_minutes"] == 2.0
    assert data["api_audio_minutes"] == 3.0
    assert data["quota_minutes_assigned"] == 120
    # 5 / 120 = 4.16%
    assert 4.0 <= data["quota_percent_used"] <= 4.3
