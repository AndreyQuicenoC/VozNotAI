# Modelo de datos

Las tablas se crean al iniciar la API.

- **users**: correo único normalizado, `password_hash`, rol `customer` o `admin`, borrado lógico con `deleted_at` cuando el modelo lo usa.
- **conversations**: un dueño.
- **messages**: rol y tipo validados en el servicio.
- **audio_assets**: metadatos y `storage_key`. El binario está en disco.
- **transcriptions**: proveedor, modelo, estado, texto, segmentos JSON, duraciones y error seguro.
- **notes**: contenido del usuario. Puede apuntar a conversación, transcripción e intervalo.
- **usage_events**: duración, costo estimado en decimal y costo real nulo hasta que un proveedor lo informe.
- **system_settings**: modo, modelo, endpoint y tarifa. La clave remota no se guarda en claro en la respuesta.
- **password_reset_tokens**: hash del token, vencimiento y uso.
- **audit_events**: acción administrativa sin contraseñas ni audio.

Estados de transcripción: `pending`, `validating`, `processing`, `completed`, `failed`.
