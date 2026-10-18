import React from "react";

interface AboutViewProps {
  onNavigate: (path: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 pb-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-[#070d1c] p-8 md:p-14">
        <div className="pointer-events-none absolute -right-10 top-0 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative z-10 max-w-3xl space-y-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">Acerca de</p>
          <h1 className="font-display text-4xl font-bold leading-tight text-white md:text-6xl">
            Un proyecto académico que transcribe y guarda el resultado.
          </h1>
          <p className="text-sm leading-7 text-slate-300 md:text-base">
            Andrey Quiceno, Jhorman Gómez, Iván Ausecha y Alejandro Enciso. El servidor usa el motor
            configurado al arrancar. Si ese motor falla, la transcripción falla: no se inventa otro texto.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate("register")}
              className="rounded-2xl bg-cyan-300 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-950"
            >
              Crear cuenta
            </button>
            <button
              type="button"
              onClick={() => onNavigate("how-it-works")}
              className="rounded-2xl border border-white/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white"
            >
              Cómo funciona
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Motor", "Los modelos previstos son base y small. El dispositivo, por ejemplo CPU, lo define el servidor. FFmpeg tiene que estar disponible para decodificar el audio."],
          ["Archivo", "El audio aceptado permanece en el servidor para reproducirlo después. No es una sesión efímera ni una garantía de retención cero."],
          ["Hablantes", "El motor devuelve texto y tiempos. Las etiquetas de hablante de esta versión no identifican personas."],
        ].map(([title, text]) => (
          <article key={title} className="rounded-3xl border border-white/10 bg-[#0d1528] p-6">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
          </article>
        ))}
      </div>

      <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-[#10182c] to-[#0c1426] p-8">
        <h2 className="text-2xl font-semibold text-white">Autores</h2>
        <p className="mt-3 text-sm text-slate-300">Andrey Quiceno, Jhorman Gómez, Iván Ausecha y Alejandro Enciso.</p>
        <a href="https://github.com/AndreyQuicenoC/VozNotAI" className="mt-4 inline-block text-sm text-cyan-300 hover:underline">
          Repositorio en GitHub
        </a>
      </section>
    </div>
  );
};
