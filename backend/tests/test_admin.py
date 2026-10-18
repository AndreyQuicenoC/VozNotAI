from backend.core.security import create_access_token


def test_customer_cannot_access_admin_endpoints_403(client, customer_user_a):
    token = create_access_token(customer_user_a.id, customer_user_a.role)
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to access admin dashboard
    res_dash = client.get("/api/v1/admin/dashboard", headers=headers)
    assert res_dash.status_code == 403
    assert res_dash.json()["detail"]["code"] == "PERMISSION_DENIED"

    # Attempt to list admin users
    res_users = client.get("/api/v1/admin/users", headers=headers)
    assert res_users.status_code == 403

    # Attempt to update AI settings
    res_set = client.put(
        "/api/v1/settings",
        headers=headers,
        json={"execution_mode": "api"},
    )
    assert res_set.status_code == 403


def test_unauthenticated_cannot_access_admin_endpoints_401(client):
    res = client.get("/api/v1/admin/dashboard")
    assert res.status_code == 401


def test_admin_dashboard_metrics(client, admin_user, customer_user_a):
    admin_token = create_access_token(admin_user.id, admin_user.role)
    headers = {"Authorization": f"Bearer {admin_token}"}

    res = client.get("/api/v1/admin/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_users"] >= 2
    assert data["active_users"] >= 2
    assert "whisper_local_available" in data
    assert "current_execution_mode" in data


def test_admin_update_user_quota_and_status(client, admin_user, customer_user_a):
    admin_token = create_access_token(admin_user.id, admin_user.role)
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Update user quota and role_title
    res = client.put(
        f"/api/v1/admin/users/{customer_user_a.id}",
        headers=headers,
        json={"max_minutes_quota": 500, "role_title": "Cliente VIP"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["max_minutes_quota"] == 500
    assert data["role_title"] == "Cliente VIP"

    # Check audit log was recorded
    audit_res = client.get("/api/v1/admin/audit", headers=headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert any("quota=500" in log["description"] for log in logs)


def test_admin_update_settings_and_audit(client, admin_user):
    admin_token = create_access_token(admin_user.id, admin_user.role)
    headers = {"Authorization": f"Bearer {admin_token}"}

    update_res = client.put(
        "/api/v1/settings",
        headers=headers,
        json={
            "execution_mode": "local",
            "local_model_name": "small",
            "usage_rate_per_audio_minute": 0.0080,
            "maximum_audio_duration_seconds": 180,
        },
    )
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["local_model_name"] == "small"
    assert float(data["usage_rate_per_audio_minute"]) == 0.0080
    assert data["maximum_audio_duration_seconds"] == 180

    # Verify audit log was generated
    audit_res = client.get("/api/v1/admin/audit", headers=headers)
    assert audit_res.status_code == 200
    assert any("CONFIG_UPDATE" in log["event_type"] for log in audit_res.json())
