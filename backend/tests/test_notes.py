from backend.core.security import create_access_token


def test_note_lifecycle_and_search(client, customer_user_a):
    token = create_access_token(customer_user_a.id, customer_user_a.role)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create note
    payload = {
        "title": "Decisión de Infraestructura GPU",
        "content": "Se confirma el uso de cuantización FP16 en RTX 4090 para producción.",
        "category": "Decisión Crítica",
        "tags": "CUDA, FP16, Whisper",
        "segment_start": 14.5,
        "segment_end": 28.0,
    }
    create_res = client.post("/api/v1/notes", headers=headers, json=payload)
    assert create_res.status_code == 201
    note_id = create_res.json()["id"]

    # 2. Search note by keyword
    search_res = client.get("/api/v1/notes?search=cuantizaci", headers=headers)
    assert search_res.status_code == 200
    assert len(search_res.json()) >= 1
    assert search_res.json()[0]["id"] == note_id

    # 3. Filter note by category
    cat_res = client.get("/api/v1/notes?category=Decisión Crítica", headers=headers)
    assert cat_res.status_code == 200
    assert len(cat_res.json()) >= 1

    # 4. Update note
    update_res = client.put(
        f"/api/v1/notes/{note_id}",
        headers=headers,
        json={"title": "Decisión Actualizada GPU"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Decisión Actualizada GPU"

    # 5. Delete note
    del_res = client.delete(f"/api/v1/notes/{note_id}", headers=headers)
    assert del_res.status_code == 204


def test_note_isolation_between_users(client, customer_user_a, customer_user_b):
    token_a = create_access_token(customer_user_a.id, customer_user_a.role)
    token_b = create_access_token(customer_user_b.id, customer_user_b.role)
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates a note
    create_res = client.post(
        "/api/v1/notes",
        headers=headers_a,
        json={"title": "Nota Privada A", "content": "Secreto comercial"},
    )
    note_id = create_res.json()["id"]

    # User B cannot read User A's note
    res_get = client.get(f"/api/v1/notes/{note_id}", headers=headers_b)
    assert res_get.status_code == 404

    # User B cannot update User A's note
    res_put = client.put(f"/api/v1/notes/{note_id}", headers=headers_b, json={"title": "Hack"})
    assert res_put.status_code == 404

    # User B cannot delete User A's note
    res_del = client.delete(f"/api/v1/notes/{note_id}", headers=headers_b)
    assert res_del.status_code == 404
