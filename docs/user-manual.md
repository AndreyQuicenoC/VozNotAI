# Manual de uso

1. Regístrese con nombre, apellido, correo y una contraseña de al menos 8 caracteres. La cuenta queda como cliente.
2. Inicie sesión. El panel muestra minutos, solicitudes y costo equivalente solo si la API los tiene. Si no hay transcripciones, los valores son cero.
3. Use «Nueva transcripción» y suba WAV, MP3 o M4A de hasta 25 MB y 2 minutos. El avance de la barra de carga no representa el porcentaje interno de Whisper.
4. Abra la conversación para leer el texto, descargarlo o anclar una nota. La nota es texto suyo, no una salida de Whisper.
5. En el perfil puede guardar nombre y apellido. El rol no se edita ahí.
6. Si olvida la contraseña, solicite recuperación. El mensaje no revela si el correo existe. Sin SMTP, el entorno de desarrollo muestra el token una sola vez en la pantalla. En producción debe configurarse el correo y ese token no debe verse.
7. El administrador, creado solo con las variables de entorno, consulta usuarios, cuotas, auditoría y el modo local o API. No hay un clúster de varias GPU en esta instalación: los avisos de caché y worker lo dicen de forma explícita.
