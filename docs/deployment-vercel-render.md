# Despliegue en Vercel (frontend) y Render (backend)

Guía para publicar VozNotAI con el frontend estático en **Vercel** y la API FastAPI en **Render**, usando PostgreSQL y almacenamiento persistente para los audios.

## Arquitectura

| Componente | Plataforma | URL típica |
|---|---|---|
| Interfaz React | Vercel | `https://tu-app.vercel.app` |
| API FastAPI | Render Web Service | `https://voznotai-api.onrender.com` |
| Base de datos | Render PostgreSQL | cadena interna `DATABASE_URL` |
| Archivos de audio | Disco Render | `/app/uploads` |

El navegador llama a la API con `credentials: "include"`. La cookie `access_token` se emite en el dominio de Render; el frontend también guarda el token Bearer en memoria tras el login.

## 1. Backend en Render

1. Conecte el repositorio de GitHub en [Render Dashboard](https://dashboard.render.com/).
2. Use **New → Blueprint** y seleccione `render.yaml`, o cree un **Web Service** manualmente:
   - **Runtime:** Docker
   - **Dockerfile path:** `backend/Dockerfile`
   - **Docker context:** raíz del repo
3. Variables de entorno obligatorias:

| Variable | Valor |
|---|---|
| `APP_ENV` | `production` |
| `APP_SECRET_KEY` | cadena aleatoria ≥ 32 caracteres |
| `DATABASE_URL` | PostgreSQL de Render (automática con Blueprint) |
| `FRONTEND_ORIGIN` | URL de Vercel **sin** barra final |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `none` (front y API en dominios distintos) |
| `ADMIN_BOOTSTRAP_EMAIL` | correo del administrador inicial |
| `ADMIN_BOOTSTRAP_PASSWORD` | contraseña fuerte (solo primer arranque) |
| `TRANSCRIPTION_MODE` | `api` o `local` (`local` exige Whisper en la imagen; la imagen Docker actual no lo incluye) |
| `TRANSCRIPTION_API_KEY` | clave del proveedor (OpenAI u otro compatible) |
| `TRANSCRIPTION_API_BASE_URL` | `https://api.openai.com/v1` |
| `UPLOAD_DIR` | `/app/uploads` |

4. Monte un **disco persistente** en `/app/uploads` (1 GB mínimo recomendado).
5. Compruebe `GET https://su-api.onrender.com/api/v1/system/health`.

### Modo API (recomendado en Render)

Con `TRANSCRIPTION_MODE=api` y `TRANSCRIPTION_API_KEY` definida, el servidor sincroniza `SystemSettings` al arrancar. Los audios se envían a `POST …/audio/transcriptions`. La clave **nunca** se expone al frontend.

### Modo local

Whisper + PyTorch no vienen en la imagen Docker por defecto. Para inferencia local necesitaría ampliar el Dockerfile con `requirements-whisper.txt` y más CPU/RAM. En producción académica se recomienda el modo API.

## 2. Frontend en Vercel

1. Importe el mismo repositorio en [Vercel](https://vercel.com/).
2. **Root Directory:** `frontend`
3. **Framework Preset:** Vite
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. Variable de entorno:

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://su-api.onrender.com/api/v1` |

7. Despliegue. El archivo `frontend/vercel.json` reescribe rutas al `index.html` (hash routing).

## 3. CORS y sesión

- `FRONTEND_ORIGIN` se añade automáticamente a `ALLOWED_ORIGINS` en el backend.
- Use `COOKIE_SAMESITE=none` y `COOKIE_SECURE=true` cuando el front esté en otro dominio.
- Tras desplegar, actualice `FRONTEND_ORIGIN` en Render con la URL final de Vercel y vuelva a desplegar la API si cambia el dominio.

## 4. Comprobaciones post-despliegue

1. Abra la URL de Vercel → Inicio, Manual, registro.
2. Registre un usuario o use el admin bootstrap.
3. Suba un audio corto (< 120 s, < 25 MB).
4. Verifique espacio de trabajo: tamaño, costo, exportación y eliminación.
5. Descargue el manual en Markdown/HTML desde la vista Manual.

## 5. Secretos

- No suba `.env` ni claves al repositorio.
- En Render, marque `TRANSCRIPTION_API_KEY` y `APP_SECRET_KEY` como **Secret**.
- En Vercel solo va `VITE_API_URL`; nunca la clave de transcripción.

## 6. CI local antes de publicar

```powershell
backend\venv\Scripts\python.exe -m pytest backend/tests -q
cd frontend
$env:NODE_OPTIONS="--use-system-ca"
node --experimental-strip-types --test src/utils/*.test.ts src/services/*.test.ts
npm run build
```

## 7. Solución de problemas

| Síntoma | Causa probable | Acción |
|---|---|---|
| Login OK pero 401 en `/api` | CORS o cookie | Revise `FRONTEND_ORIGIN`, `COOKIE_SAMESITE=none`, `VITE_API_URL` |
| Subida 502 en API | Modo local sin Whisper | Cambie a `TRANSCRIPTION_MODE=api` y configure la clave |
| Audios desaparecen al reiniciar | Sin disco persistente | Monte disco en `/app/uploads` |
| Manual descarga la web | Versión antigua del front | Despliegue con exportación MD/HTML del manual |
