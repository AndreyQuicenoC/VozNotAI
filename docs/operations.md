# Operación

- Salud: `GET /api/v1/system/health`.
- Motor: `GET /api/v1/system/status`. `local_whisper.available` es el resultado de importar Whisper y encontrar FFmpeg, no un valor fijo.
- Un solo trabajo local a la vez.
- Los temporales de audio deben limpiarse al terminar el procesamiento. Revise `uploads/` si un fallo deja archivos.
- Los registros no deben incluir tokens ni claves. El bootstrap de administrador escribe el correo, no la contraseña.
- Copia de seguridad local: copie `voznotai.db` y el directorio `uploads/` con la API detenida.
