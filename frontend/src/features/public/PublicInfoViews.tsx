import React from "react";

interface PublicPageProps {
  onNavigate: (path: string) => void;
}

function PageHero({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <div className="relative rounded-3xl bg-gradient-to-br from-[#0c1322] via-[#09101d] to-[#121d36] border border-cyan-500/20 p-8 md:p-12 overflow-hidden">
      <div className="relative z-10 max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          {kicker}
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight">{title}</h1>
        <p className="text-sm md:text-base text-gray-300 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

export const HomeView: React.FC<PublicPageProps> = ({ onNavigate }) => (
  <div className="space-y-10 animate-fade-in pb-16">
    <PageHero
      kicker="VozNotAI • ClustLayer / Eureka Solutions"
      title="Transcribe audio con Whisper y conserva el texto en tu cuenta."
      body="Sube un archivo o graba desde el micrófono. El servidor valida el audio, lo transcribe con el motor configurado y guarda la conversación, el texto y las notas del usuario que inició sesión."
    />
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => onNavigate("register")}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold text-xs uppercase tracking-wider cursor-pointer"
      >
        Crear cuenta
      </button>
      <button
        onClick={() => onNavigate("login")}
        className="px-6 py-3 rounded-xl bg-[#151f38] border border-gray-700 text-gray-200 text-xs cursor-pointer"
      >
        Iniciar sesión
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        ["Subida y grabación", "WAV, MP3, M4A, FLAC y OGG. La grabación del navegador se convierte a WAV antes de enviarla."],
        ["Transcripción", "Whisper local o un proveedor remoto, según la configuración del servidor. No hay cambio silencioso de uno a otro."],
        ["Notas y uso", "Cada usuario ve sus conversaciones, notas y el costo estimado con la tarifa de referencia."],
      ].map(([title, text]) => (
        <article key={title} className="p-6 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-2">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <p className="text-xs text-gray-400 leading-relaxed">{text}</p>
        </article>
      ))}
    </div>
  </div>
);

export const FeaturesView: React.FC<PublicPageProps> = ({ onNavigate }) => (
  <div className="space-y-8 animate-fade-in pb-16">
    <PageHero
      kicker="Funcionalidades disponibles"
      title="Lo que el sistema hace en esta versión."
      body="Las cuentas de cliente transcriben y anotan. La cuenta administradora consulta usuarios, cuotas, auditoría y el modo del motor."
    />
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        ["Sesión", "Registro, inicio de sesión y recuperación de contraseña. La sesión viaja en una cookie HttpOnly."],
        ["Conversaciones", "Cada audio aceptado crea o actualiza una conversación con su texto y segmentos."],
        ["Notas", "El texto de una nota lo escribe el usuario. No es una salida automática de Whisper."],
        ["Uso", "Minutos y costo estimado. El costo real solo aparece si el proveedor lo informa."],
        ["Administración", "Usuarios, cuota de minutos, eventos de auditoría y estado de FFmpeg y Whisper."],
        ["Límites", "Hasta 25 MB y 120 segundos por audio en la configuración inicial."],
      ].map(([title, text]) => (
        <li key={title} className="p-5 rounded-2xl bg-[#0f172a] border border-gray-800">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">{text}</p>
        </li>
      ))}
    </ul>
    <button onClick={() => onNavigate("manual")} className="text-sm text-cyan-400 hover:underline cursor-pointer">
      Abrir el manual de uso
    </button>
  </div>
);

export const HowItWorksView: React.FC<PublicPageProps> = ({ onNavigate }) => (
  <div className="space-y-8 animate-fade-in pb-16">
    <PageHero
      kicker="Flujo de transcripción"
      title="Del micrófono o del archivo al texto guardado."
      body="El navegador no inventa la transcripción. El archivo llega a la API, se valida y el motor configurado produce el texto."
    />
    <ol className="space-y-4">
      {[
        "Inicias sesión. Sin sesión no se puede subir audio.",
        "Eliges un archivo permitido o grabas. La grabación se decodifica en el navegador y se reempaqueta como WAV PCM.",
        "La API revisa tamaño, extensión y los primeros bytes. Rechaza ejecutables, HTML y contenedores que no coinciden con el formato declarado.",
        "Si el modo es local, Whisper corre en este servidor con FFmpeg. Si el modo es API, el audio se envía solo al proveedor configurado.",
        "La conversación queda asociada a tu usuario. Puedes leerla, reproducir el audio guardado y añadir una nota.",
      ].map((step, index) => (
        <li key={step} className="p-5 rounded-2xl bg-[#0f172a] border border-gray-800 flex gap-4">
          <span className="text-cyan-400 font-mono text-sm">{index + 1}</span>
          <p className="text-sm text-gray-300 leading-relaxed">{step}</p>
        </li>
      ))}
    </ol>
    <p className="text-xs text-gray-500">
      Esta instalación no reparte el trabajo entre varias GPU. Los modelos locales previstos son base y small.
    </p>
    <button onClick={() => onNavigate("privacy")} className="text-sm text-cyan-400 hover:underline cursor-pointer">
      Ver qué se guarda
    </button>
  </div>
);

export const PrivacyView: React.FC<PublicPageProps> = () => (
  <div className="space-y-8 animate-fade-in pb-16">
    <PageHero
      kicker="Datos que el sistema conserva"
      title="Privacidad de esta instalación, sin certificaciones inventadas."
      body="VozNotAI no declara cumplimiento HIPAA, GDPR ni una política de retención cero. Aquí está lo que el código hace."
    />
    <div className="space-y-4">
      {[
        ["Cuenta", "Se guardan nombre, correo y el hash de la contraseña. La contraseña en claro no se almacena ni se escribe en auditoría."],
        ["Sesión", "El token va en una cookie HttpOnly. El navegador no lo copia a localStorage."],
        ["Audio", "El archivo aceptado se guarda en el servidor para que su dueño pueda reproducirlo. No se borra al terminar la transcripción."],
        ["Modo local", "Whisper corre en la máquina de la API. El audio no sale a un proveedor externo."],
        ["Modo API", "Si un administrador activa el proveedor remoto, ese audio sí se envía al endpoint configurado."],
        ["Aislamiento", "Un cliente consulta sus conversaciones, notas y audios. No ve los de otra cuenta."],
      ].map(([title, text]) => (
        <article key={title} className="p-5 rounded-2xl bg-[#0f172a] border border-gray-800">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">{text}</p>
        </article>
      ))}
    </div>
  </div>
);
