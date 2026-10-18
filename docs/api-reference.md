# Referencia de API

Base: `/api/v1`.

Autenticación: cookie `access_token` o cabecera `Authorization: Bearer`.

| Método | Ruta | Quién |
|---|---|---|
| POST | `/auth/register` | Público. Rol resultante: customer |
| POST | `/auth/login` | Público |
| POST | `/auth/logout` | Sesión |
| GET | `/auth/me` | Sesión |
| PUT | `/auth/me` | Sesión. No cambia el rol |
| POST | `/auth/password-recovery` | Público. Respuesta genérica |
| POST | `/auth/password-reset` | Token de un solo uso |
| GET/POST | `/conversations` | Dueño |
| GET/PUT/DELETE | `/conversations/{id}` | Dueño |
| POST | `/transcriptions/upload` | Dueño. Multipart `file` |
| GET | `/transcriptions` | Dueño |
| GET | `/transcriptions/{id}` | Dueño |
| GET | `/transcriptions/{id}/export` | Dueño. `format=txt|srt|vtt|json` |
| GET | `/transcriptions/{id}/audio` | Dueño |
| GET/POST | `/notes` | Dueño |
| GET | `/usage/summary` | Dueño |
| GET/PUT | `/settings` | Lectura autenticada. Escritura solo admin |
| GET | `/admin/dashboard` | Admin |
| GET/PUT | `/admin/users` | Admin |
| GET | `/system/health` | Público |
| GET | `/system/status` | Público. Estado del motor, sin secretos |

OpenAPI de desarrollo: `http://127.0.0.1:8000/docs`.
