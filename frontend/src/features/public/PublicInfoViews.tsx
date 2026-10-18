import React, { useState } from "react";

interface PublicPageProps {
  onNavigate: (path: string) => void;
}

function PageHero({
  kicker,
  title,
  body,
  children,
}: {
  kicker: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-[#070d1c] p-8 md:p-14 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="relative z-10 max-w-3xl space-y-5">
        <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
          {kicker}
        </p>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">{title}</h1>
        <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">{body}</p>
        {children}
      </div>
    </section>
  );
}

function ActionButton({
  children,
  onClick,
  tone = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "primary" | "ghost";
}) {
  const styles =
    tone === "primary"
      ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-200"
      : "border border-white/15 bg-white/5 text-white hover:bg-white/10";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] transition ${styles}`}
    >
      {children}
    </button>
  );
}

export const HomeView: React.FC<PublicPageProps> = ({ onNavigate }) => (
  <div className="space-y-8 pb-16">
    <PageHero
      kicker="VozNotAI · ClustLayer / Eureka"
      title="Tu audio entra. El texto queda en tu cuenta."
      body="Sube un archivo o graba desde el micrófono. El servidor valida el audio, lo transcribe con el motor configurado y guarda la conversación para quien inició sesión."
    >
      <div className="flex flex-wrap gap-3 pt-2">
        <ActionButton onClick={() => onNavigate("register")}>Crear cuenta</ActionButton>
        <ActionButton tone="ghost" onClick={() => onNavigate("login")}>
          Iniciar sesión
        </ActionButton>
      </div>
    </PageHero>
    <div className="grid gap-4 md:grid-cols-3">
      {[
        ["01", "Subida y grabación", "WAV, MP3, M4A, FLAC y OGG. La grabación del navegador se convierte a WAV antes de enviarla."],
        ["02", "Transcripción", "El motor configurado produce el texto. No hay un cambio silencioso a otro proveedor si el primero falla."],
        ["03", "Notas y costo", "Cada usuario ve sus conversaciones, escribe sus notas y consulta el costo estimado de sus minutos."],
      ].map(([index, title, text]) => (
        <article
          key={title}
          className="group rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-6 transition hover:-translate-y-1 hover:border-cyan-300/40"
        >
          <p className="font-mono text-xs text-cyan-300">{index}</p>
          <h2 className="mt-4 text-xl font-semibold text-white">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
        </article>
      ))}
    </div>
  </div>
);

export const FeaturesView: React.FC<PublicPageProps> = ({ onNavigate }) => (
  <div className="space-y-8 pb-16">
    <PageHero
      kicker="Funcionalidades"
      title="Lo que esta versión hace de verdad."
      body="Las cuentas de cliente transcriben y anotan. La cuenta administradora consulta usuarios, cuotas, auditoría y el estado del motor."
    />
    <ul className="grid gap-4 md:grid-cols-2">
      {[
        ["Sesión", "Registro, inicio de sesión y recuperación. La sesión viaja en una cookie HttpOnly."],
        ["Conversaciones", "Cada audio aceptado queda ligado a una conversación con texto y segmentos."],
        ["Notas", "El texto de una nota lo escribe el usuario. No es una salida automática del motor."],
        ["Uso", "Minutos y costo estimado con la tarifa de referencia del servidor."],
        ["Administración", "Usuarios, cuota de minutos, auditoría y estado de FFmpeg y del motor."],
        ["Límites", "Hasta 25 MB y 120 segundos por audio en la configuración inicial."],
      ].map(([title, text]) => (
        <li key={title} className="rounded-3xl border border-white/10 bg-[#0d1528] p-6">
          <div className="mb-4 h-1 w-12 rounded-full bg-gradient-to-r from-cyan-300 to-indigo-400" />
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
        </li>
      ))}
    </ul>
    <button type="button" onClick={() => onNavigate("manual")} className="text-sm text-cyan-300 hover:underline">
      Abrir el manual de uso
    </button>
  </div>
);

export const HowItWorksView: React.FC<PublicPageProps> = ({ onNavigate }) => (
  <div className="space-y-8 pb-16">
    <PageHero
      kicker="Cómo funciona"
      title="Del archivo al texto guardado."
      body="El navegador no inventa la transcripción. El archivo llega a la API, se valida y el motor configurado produce el texto."
    />
    <ol className="relative space-y-4 border-l border-cyan-300/30 pl-6">
      {[
        "Inicias sesión. Sin sesión no se puede subir audio.",
        "Eliges un archivo permitido o grabas. La grabación se decodifica en el navegador y se reempaqueta como WAV PCM.",
        "La API revisa tamaño, extensión y los primeros bytes. Rechaza ejecutables, HTML y contenedores que no coinciden con el formato declarado.",
        "El motor configurado transcribe el audio. Si falla, la solicitud falla: no se sustituye por otro proveedor en silencio.",
        "La conversación queda en tu cuenta. Puedes leerla, reproducir el audio guardado y añadir una nota o una etiqueta.",
      ].map((step, index) => (
        <li key={step} className="relative rounded-3xl border border-white/10 bg-[#0d1528] p-5">
          <span className="absolute -left-[2.15rem] top-6 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-300 text-xs font-bold text-slate-950">
            {index + 1}
          </span>
          <p className="text-sm leading-6 text-slate-200">{step}</p>
        </li>
      ))}
    </ol>
    <p className="text-xs text-slate-500">
      Esta instalación no reparte el trabajo entre varias GPU. Los modelos previstos para el servidor son base y small.
    </p>
    <button type="button" onClick={() => onNavigate("privacy")} className="text-sm text-cyan-300 hover:underline">
      Ver qué se guarda
    </button>
  </div>
);

const PRIVACY_SECTIONS = [
  ["Cuenta", "Se guardan nombre, correo y el hash de la contraseña. La contraseña en claro no se almacena ni se escribe en auditoría."],
  ["Sesión", "El token va en una cookie HttpOnly. El navegador no lo copia a localStorage."],
  ["Audio", "El archivo aceptado se guarda en el servidor para que su dueño pueda reproducirlo. No se borra al terminar la transcripción."],
  ["Modo del servidor", "Cuando el motor corre en la máquina de la API, el audio no sale a un proveedor externo."],
  ["Modo API", "Si un administrador activa el proveedor remoto, ese audio sí se envía al endpoint configurado."],
  ["Aislamiento", "Un cliente consulta sus conversaciones, notas y audios. No ve los de otra cuenta."],
];

export const PrivacyView: React.FC<PublicPageProps> = () => {
  const [open, setOpen] = useState<string | null>("Cuenta");
  return (
    <div className="space-y-8 pb-16">
      <PageHero
        kicker="Privacidad"
        title="Qué conserva esta instalación."
        body="VozNotAI no declara cumplimiento HIPAA, GDPR ni una política de retención cero. Cada bloque se abre con el control de la izquierda."
      />
      <div className="space-y-3">
        {PRIVACY_SECTIONS.map(([title, text]) => {
          const expanded = open === title;
          return (
            <article key={title} className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d1528]">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : title)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                <span className={`text-lg text-cyan-300 transition ${expanded ? "rotate-90" : ""}`} aria-hidden>
                  &gt;
                </span>
                <h2 className="text-base font-semibold text-white">{title}</h2>
              </button>
              {expanded && <p className="px-14 pb-5 text-sm leading-6 text-slate-300">{text}</p>}
            </article>
          );
        })}
      </div>
    </div>
  );
};
