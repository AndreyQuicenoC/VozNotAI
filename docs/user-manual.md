# Manual de uso

Documento resumido. La versión completa para descarga (Markdown y HTML) se genera desde la vista **Manual** de la aplicación y desde `frontend/src/content/operatorManual.ts`.

## Inicio rápido

1. Regístrese con nombre, apellido, correo y contraseña (mínimo 8 caracteres).
2. Inicie sesión. El panel muestra minutos, solicitudes y costo estimado según la API.
3. Suba WAV, MP3, M4A, FLAC u OGG (hasta 25 MB y 120 s) o grabe desde el micrófono.
4. Abra el espacio de trabajo para leer, exportar, etiquetar o eliminar conversaciones.
5. Escriba notas vinculadas al audio; el texto lo define usted, no el motor.

## Perfil y preferencias

- Guarde nombre, apellido, foto (data URL) e idioma preferido de transcripción.
- La pestaña **Consumo & Ahorro** muestra minutos y costo estimado de su cuenta.

## Administración

- El administrador (bootstrap por variables de entorno) gestiona usuarios, cuotas, auditoría y modo local/API.
- La clave del proveedor remoto vive solo en el servidor (`TRANSCRIPTION_API_KEY`).

## Exportar este manual

En la app: **Manual → Descargar manual completo → Markdown o HTML**. El HTML está maquetado para imprimir a PDF desde el navegador sin capturar la interfaz web.

## Despliegue

Vercel + Render: [deployment-vercel-render.md](deployment-vercel-render.md).
