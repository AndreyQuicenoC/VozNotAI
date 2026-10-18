# VozNotAI

[![CI](https://github.com/AndreyQuicenoC/VozNotAI/actions/workflows/ci.yml/badge.svg)](https://github.com/AndreyQuicenoC/VozNotAI/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/Python-3.12%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue)](LICENSE)

Plataforma académica de ClustLayer, línea Eureka Solutions, para transcribir audio con Whisper, conservar conversaciones, crear notas y medir el consumo de inteligencia artificial.

Integrantes: Andrey Quiceno, Jhorman Gómez, Iván Ausecha y Alejandro Enciso.  
Código: https://github.com/AndreyQuicenoC/VozNotAI

La aplicación que se ejecuta está en `frontend/` y `backend/`. La carpeta `src/` de la raíz es el export original de Google AI Studio y no arranca el producto.

## Documentación

| Documento | Para qué sirve |
|---|---|
| [Manual de uso](docs/user-manual.md) | Registro, transcripción, notas y administración |
| [Arquitectura](docs/architecture.md) | Capas, proveedores y límites del monolito |
| [Referencia de API](docs/api-reference.md) | Rutas, autenticación y permisos |
| [Modelo de datos](docs/data-model.md) | Entidades persistentes y estados |
| [Seguridad](docs/security.md) | Sesión, archivos, secretos y lo que no está certificado |
| [Despliegue](docs/deployment.md) | Local, Docker y modo API |
| [Vercel + Render](docs/deployment-vercel-render.md) | Frontend en Vercel, API y PostgreSQL en Render |
| [Operación](docs/operations.md) | Salud, motor, respaldos |
| [Pruebas](docs/testing.md) | Pytest, pruebas de Node y lo que falta |
| [Calidad ISO/IEC 25010](docs/quality/iso-25010.md) | Decisiones y resultado medido |
| [Marca y diseño](docs/brand-and-design.md) | Identidad visual de Stitch |
| [Cambios](CHANGELOG.md) | Historial de versiones |

## Requisitos

- Python 3.12 o 3.13.
- Node.js 22.
- FFmpeg en el `PATH` para transcripción local.
- Para Whisper local, además: `pip install -r backend/requirements-whisper.txt` y el modelo `base` o `small`.

## Arranque local

1. Copie `.env.example` a `.env` y `frontend/.env.example` a `frontend/.env`.
2. Genere `APP_SECRET_KEY` con al menos 32 caracteres aleatorios.
3. Defina `ADMIN_BOOTSTRAP_EMAIL` y `ADMIN_BOOTSTRAP_PASSWORD`. Sin esas dos variables no se crea administrador y no existe una contraseña por defecto.
4. Instale y arranque la API desde la raíz:

```powershell
backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\scripts\start-backend.ps1
```

5. En otra terminal:

```powershell
.\scripts\start-frontend.ps1
```

La interfaz queda en http://localhost:3000 y la API en http://127.0.0.1:8000. Vite reenvía `/api` hacia la API, así la cookie de sesión permanece en el mismo origen.

Compruebe http://127.0.0.1:8000/api/v1/system/health.

## Whisper local

`TRANSCRIPTION_MODE=local` y `LOCAL_WHISPER_MODEL=base` o `small`. La primera carga descarga los pesos si hay internet. El estado real se consulta en `/api/v1/system/status`. Si faltan FFmpeg o PyTorch, el motor se informa como no disponible. No hay transcripción inventada.

## Proveedor API

Un administrador autenticado guarda el modo `api`, el endpoint HTTPS, el modelo y la clave. La clave no vuelve al navegador. Si el modo es API y la configuración está incompleta, el sistema no cambia en silencio al motor local.

## Pruebas

```powershell
backend\venv\Scripts\python.exe -m pytest backend/tests --cov=backend --cov-report=term-missing
cd frontend
npx tsx --test src/utils/*.test.ts src/services/*.test.ts
```

## Documentación

- [Arquitectura](docs/architecture.md)
- [Seguridad](docs/security.md)
- [Despliegue](docs/deployment.md)
- [Pruebas](docs/testing.md)
- [Manual](docs/user-manual.md)
- [Calidad ISO/IEC 25010](docs/quality/iso-25010.md)
