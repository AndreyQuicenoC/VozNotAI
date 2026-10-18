from backend.core.security import create_access_token


def test_transcription_list_is_scoped_to_the_authenticated_user(client, customer_user_a):
    denied = client.get("/api/v1/transcriptions")
    assert denied.status_code == 401

    token = create_access_token(customer_user_a.id, customer_user_a.role)
    res = client.get("/api/v1/transcriptions", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json() == []


def test_conversation_lifecycle(client, customer_user_a):
    token_a = create_access_token(customer_user_a.id, customer_user_a.role)
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 1. Create conversation
    create_res = client.post(
        "/api/v1/conversations",
        headers=headers_a,
        json={"title": "Reunión de Estrategia Legal"},
    )
    assert create_res.status_code == 201
    conv_id = create_res.json()["id"]

    # 2. List conversations
    list_res = client.get("/api/v1/conversations", headers=headers_a)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Get detail
    detail_res = client.get(f"/api/v1/conversations/{conv_id}", headers=headers_a)
    assert detail_res.status_code == 200
    assert detail_res.json()["title"] == "Reunión de Estrategia Legal"

    # 4. Post message
    msg_res = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        headers=headers_a,
        json={"content": "Mensaje de prueba para la conversación."},
    )
    assert msg_res.status_code == 201

    # 5. Update title
    update_res = client.put(
        f"/api/v1/conversations/{conv_id}",
        headers=headers_a,
        json={"title": "Reunión Actualizada Q3"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Reunión Actualizada Q3"

    # 6. Delete conversation
    del_res = client.delete(f"/api/v1/conversations/{conv_id}", headers=headers_a)
    assert del_res.status_code == 204


def test_bola_protection_prevent_access_to_other_users_conversations(
    client, customer_user_a, customer_user_b
):
    token_a = create_access_token(customer_user_a.id, customer_user_a.role)
    token_b = create_access_token(customer_user_b.id, customer_user_b.role)
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates a confidential conversation
    create_res = client.post(
        "/api/v1/conversations",
        headers=headers_a,
        json={"title": "Conversación Confidencial de Usuario A"},
    )
    assert create_res.status_code == 201
    conv_id = create_res.json()["id"]

    # User B attempts to GET User A's conversation -> MUST return 404 (IDOR prevented)
    idor_get = client.get(f"/api/v1/conversations/{conv_id}", headers=headers_b)
    assert idor_get.status_code == 404

    # User B attempts to UPDATE User A's conversation -> MUST return 404
    idor_put = client.put(
        f"/api/v1/conversations/{conv_id}",
        headers=headers_b,
        json={"title": "Hackeado por Usuario B"},
    )
    assert idor_put.status_code == 404

    # User B attempts to DELETE User A's conversation -> MUST return 404
    idor_del = client.delete(f"/api/v1/conversations/{conv_id}", headers=headers_b)
    assert idor_del.status_code == 404
