# Seguridad

Controles implementados en el código actual:

- Contraseñas con hash. El registro público no acepta rol.
- Sesión en cookie `HttpOnly`, `SameSite=lax`, `Secure` solo si `COOKIE_SECURE=true`, ruta `/`. El frontend no guarda el token en `localStorage`.
- Autorización por usuario en conversaciones, notas, audios y transcripciones.
- Validación de extensión, tamaño y bytes del audio en el backend. Límite inicial: 120 segundos y 25 MB.
- El endpoint remoto rechaza destinos locales y redes privadas.
- La clave del proveedor no se devuelve; solo una máscara.
- El administrador de arranque exige `ADMIN_BOOTSTRAP_EMAIL` y `ADMIN_BOOTSTRAP_PASSWORD`. No hay contraseña conocida en el código.

Esto no es una certificación OWASP ni una declaración de ausencia de vulnerabilidades. No se ejecutó un escaneo de CVE en esta entrega.

Pendiente: CSRF con token propio para operaciones con cookie entre orígenes distintos al proxy de Vite, migraciones Alembic y revisión formal de dependencias.
