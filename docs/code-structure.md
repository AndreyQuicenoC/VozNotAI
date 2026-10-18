# Estructura del código

## Backend

### API
- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- `POST /api/v1/auth/password-recovery`, `POST /api/v1/auth/password-reset`
- `GET /api/v1/transcriptions` y `GET /api/v1/transcriptions?conversation_id=`
- Conversaciones, notas, uso, ajustes, administración y `GET /api/v1/system/status`

### Servicios
- `AuthService`, `TranscriptionService`, `ConversationService`, `NoteService`, `UsageService`, `AdminService`
- `LocalWhisperProvider`, `RemoteTranscriptionProvider`, `provider_factory`

### Modelos
- User, Conversation, Message, AudioAsset, Transcription, Note, UsageEvent, SystemSettings, PasswordResetToken, AuditEvent

## Frontend

### Aplicación vigente
- `frontend/src/App.tsx` enruta por hash.
- `frontend/src/services/api.ts` cliente HTTP.
- `frontend/src/services/store.ts` estado conectado a la API.
- Vistas en `frontend/src/features/`.

### Export original
- `src/` en la raíz. No arrancar este árbol.

## Estructuras críticas
- `backend/api/deps.py`: autenticación y rol admin.
- `backend/services/ai/provider_factory.py`: no cambiar de proveedor en silencio.
- `backend/db/init_db.py`: no reintroducir una contraseña por defecto.
