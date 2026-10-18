from backend.core.security import create_access_token


def test_user_registration_success(client):
    payload = {
        "first_name": "Valeria",
        "last_name": "Restrepo",
        "email": "valeria.restrepo@clinica.co",
        "password": "SecurePassword123!",
        "phone": "+57 300 999 8877",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "valeria.restrepo@clinica.co"
    assert data["user"]["role"] == "customer"  # Non-admin enforced


def test_user_registration_duplicate_email(client, customer_user_a):
    payload = {
        "first_name": "Duplicado",
        "last_name": "Test",
        "email": customer_user_a.email,
        "password": "AnotherPassword123!",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 400
    assert res.json()["detail"]["code"] == "EMAIL_ALREADY_EXISTS"


def test_login_success_and_cookie_set(client, customer_user_a):
    payload = {
        "email": customer_user_a.email,
        "password": "Password123!",
    }
    res = client.post("/api/v1/auth/login", json=payload)
    assert res.status_code == 200
    assert "access_token" in res.json()
    assert "access_token" in res.cookies


def test_login_invalid_password(client, customer_user_a):
    payload = {
        "email": customer_user_a.email,
        "password": "WrongPassword!",
    }
    res = client.post("/api/v1/auth/login", json=payload)
    assert res.status_code == 401


def test_logout_clears_cookie(client):
    res = client.post("/api/v1/auth/logout")
    assert res.status_code == 200
    assert "access_token" not in res.cookies or res.cookies["access_token"] == ""


def test_get_current_profile(client, customer_user_a):
    token = create_access_token(customer_user_a.id, customer_user_a.role)
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == customer_user_a.email
    assert "password_hash" not in data  # Never leak password hash


def test_password_recovery_and_reset_flow(client, customer_user_a):
    # 1. Request recovery
    req_res = client.post("/api/v1/auth/password-recovery", json={"email": customer_user_a.email})
    assert req_res.status_code == 200
    data = req_res.json()
    token = data.get("dev_reset_token")
    assert token is not None

    # 2. Reset password using token
    confirm_res = client.post(
        "/api/v1/auth/password-reset",
        json={"token": token, "new_password": "BrandNewPassword123!"},
    )
    assert confirm_res.status_code == 200

    # 3. Verify login with new password
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": customer_user_a.email, "password": "BrandNewPassword123!"},
    )
    assert login_res.status_code == 200
