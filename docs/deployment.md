# Despliegue

## Local

Siga el `README.md` de la raíz. La API y el frontend se inician por separado.

## Docker

`docker compose up --build` construye la API con FFmpeg y sin PyTorch. Whisper local no entra en esa imagen: instálelo en el entorno que vaya a inferir, o use el modo API.

Antes de levantar Compose debe existir `.env` con `APP_SECRET_KEY` y, si quiere el primer administrador, las variables de bootstrap. El volumen `voznotai-data` guarda SQLite y los audios.

No hay un destino de nube configurado. El workflow de GitHub Actions solo prueba; no despliega.

## Modo API

Los audios salen hacia el proveedor configurado y quedan sujetos a sus condiciones. En modo local el audio no se envía a ese proveedor.
