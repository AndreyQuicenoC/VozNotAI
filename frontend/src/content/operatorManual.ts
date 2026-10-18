export type ManualSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export const OPERATOR_MANUAL_META = {
  title: "Manual del operador — VozNotAI",
  version: "1.1.0",
  organization: "ClustLayer / Eureka Solutions",
  authors: "Andrey Quiceno, Jhorman Gómez, Iván Ausecha y Alejandro Enciso",
};

export const OPERATOR_MANUAL_SECTIONS: ManualSection[] = [
  {
    id: "inicio",
    title: "1. Guía rápida de inicio",
    paragraphs: [
      "VozNotAI transcribe archivos de audio y guarda el texto en la cuenta del usuario que inició sesión.",
      "El producto activo vive en frontend/ y backend/. No use la carpeta src/ de la raíz para ejecutar el sistema.",
    ],
    bullets: [
      "Regístrese con nombre, apellido, correo y contraseña de al menos 8 caracteres.",
      "Inicie sesión. La sesión viaja en una cookie HttpOnly y, cuando aplica, en el token Bearer en memoria.",
      "Use «Nueva transcripción» o «Subir audio» para enviar WAV, MP3, M4A, FLAC u OGG (hasta 25 MB y 120 s).",
      "Abra el espacio de trabajo para leer el texto, exportarlo, anotar y administrar etiquetas.",
    ],
  },
  {
    id: "formatos",
    title: "2. Formatos y carga de audio",
    paragraphs: [
      "La API valida extensión, tamaño y los primeros bytes del archivo. Rechaza ejecutables, HTML y contenedores que no coinciden con el formato declarado.",
      "La grabación del navegador se decodifica y se reempaqueta como WAV PCM antes de enviarse.",
    ],
    bullets: [
      "Formatos admitidos: WAV, MP3, M4A, FLAC, OGG.",
      "Límite inicial: 25 MB y 120 segundos por audio.",
      "Si el motor configurado falla, la solicitud falla; no se sustituye silenciosamente por otro proveedor.",
    ],
  },
  {
    id: "workspace",
    title: "3. Espacio de trabajo",
    paragraphs: [
      "Cada audio aceptado queda asociado a una conversación con duración, tamaño almacenado, costo estimado y segmentos de texto.",
      "Mientras una transcripción está en estado «Procesando», la lista se actualiza automáticamente sin recargar la página.",
    ],
    bullets: [
      "Reproduzca el audio, busque palabras en el texto y edite el título de la conversación.",
      "Añada o elimine etiquetas; se guardan en el servidor (máximo 8 por conversación).",
      "Elimine un audio desde el espacio de trabajo o desde el dashboard cuando ya no lo necesite.",
      "Exporte la transcripción en TXT, SRT, VTT, JSON o PDF desde el menú Exportar.",
    ],
  },
  {
    id: "diarizacion",
    title: "4. Hablantes y segmentos",
    paragraphs: [
      "Whisper devuelve texto y marcas de tiempo. Las etiquetas «Hablante 1 / 2» alternan por segmento; no identifican personas reales.",
      "No hay un modelo de diarización (PyAnnote) instalado en esta versión.",
    ],
  },
  {
    id: "notas",
    title: "5. Notas inteligentes",
    paragraphs: [
      "Las notas las escribe el usuario. No son una salida automática del motor de transcripción.",
      "Puede anclar una nota a un instante del audio y consultarla desde el hub de notas.",
    ],
  },
  {
    id: "exportacion",
    title: "6. Exportación",
    paragraphs: [
      "Desde el espacio de trabajo puede descargar la transcripción en varios formatos.",
      "Este manual también puede descargarse en Markdown o HTML desde la vista Manual (público o autenticado).",
    ],
    bullets: [
      "TXT: texto plano con título y segmentos.",
      "SRT / VTT: subtítulos con tiempos.",
      "JSON: metadatos y segmentos estructurados.",
      "PDF: informe imprimible generado en el cliente a partir del contenido de la sesión.",
    ],
  },
  {
    id: "atajos",
    title: "7. Atajos útiles",
    bullets: [
      "Ctrl+K o / : abrir buscador global de sesiones (cuando está disponible en la barra).",
      "Espacio de trabajo: buscar palabras dentro de la transcripción activa.",
    ],
  },
  {
    id: "roles",
    title: "8. Roles y permisos",
    paragraphs: [
      "Cliente: transcribe, anota, exporta y gestiona sus conversaciones.",
      "Administrador: consulta usuarios, cuotas, auditoría y el modo del motor (local o API remota).",
      "Un cliente no ve conversaciones, notas ni audios de otra cuenta.",
    ],
  },
  {
    id: "despliegue",
    title: "9. Despliegue y motor API",
    paragraphs: [
      "En producción configure APP_SECRET_KEY, DATABASE_URL (PostgreSQL recomendado), FRONTEND_ORIGIN, COOKIE_SECURE=true y, si front y API están en dominios distintos, COOKIE_SAMESITE=none.",
      "La clave TRANSCRIPTION_API_KEY solo vive en el servidor (Render). Nunca se expone al navegador.",
      "Con TRANSCRIPTION_MODE=api y la clave configurada, el audio se envía al proveedor remoto indicado (por defecto OpenAI /v1/audio/transcriptions).",
    ],
    bullets: [
      "Frontend en Vercel: VITE_API_URL=https://su-api.onrender.com/api/v1",
      "Backend en Render: disco persistente montado en /app/uploads para los archivos de audio.",
      "Consulte docs/deployment-vercel-render.md para el paso a paso completo.",
    ],
  },
];
