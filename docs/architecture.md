# Arquitectura

VozNotAI es un monolito modular: React en `frontend/` y FastAPI en `backend/`. No hay microservicios.

## Backend

- `api/`: routers HTTP.
- `services/`: reglas de negocio. La transcripción usa Strategy (`LocalWhisperProvider`, `RemoteTranscriptionProvider`) y Factory (`provider_factory`).
- `repositories/`: acceso a datos.
- `models/`: entidades SQLAlchemy. El esquema se crea con `create_all` al arrancar. Alembic está declarado como dependencia, pero todavía no hay revisiones de migración.
- La inferencia local corre fuera del hilo de eventos mediante el proveedor y un semáforo de una tarea.

## Frontend

La interfaz conserva el diseño de Google AI Studio / Stitch (hash routing, Tailwind, vistas en `features/`). `services/api.ts` habla con `/api/v1`. `services/store.ts` hidrata la sesión, las conversaciones, las notas, el consumo y el estado del motor desde esa API.

La carpeta `src/` de la raíz es el export original y no está conectada a la API.

## Datos

SQLite en desarrollo (`voznotai.db`). PostgreSQL se configura con `DATABASE_URL` cuando exista un servidor. Los audios viven en disco (`uploads/`), no dentro de la base.
