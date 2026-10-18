import React from "react";

interface AboutViewProps {
  onNavigate: (path: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-12 animate-fade-in pb-16">
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0c1322] via-[#09101d] to-[#121d36] border border-cyan-500/20 p-8 md:p-14 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            ClustLayer / Eureka Solutions
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight">
            VozNotAI transcribe audio con el motor que el servidor tiene configurado.
          </h1>
          <p className="text-sm md:text-base text-gray-300 leading-relaxed">
            Es un proyecto académico de Andrey Quiceno, Jhorman Gómez, Iván Ausecha y Alejandro Enciso.
            El modo local ejecuta Whisper en la máquina de la API. El modo remoto usa el proveedor
            configurado y no se activa solo si el local falla.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={() => onNavigate("register")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold text-xs tracking-wider uppercase cursor-pointer"
            >
              Crear cuenta
            </button>
            <button
              onClick={() => onNavigate("how-it-works")}
              className="px-6 py-3 rounded-xl bg-[#151f38] hover:bg-[#1e2c4d] border border-gray-700 text-gray-200 text-xs font-medium cursor-pointer"
            >
              Cómo funciona
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article className="p-6 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-3">
          <h2 className="text-base font-semibold text-white">Whisper local</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Los modelos previstos son base y small. El dispositivo lo define el servidor, por ejemplo CPU.
            FFmpeg tiene que estar disponible para decodificar el audio.
          </p>
        </article>
        <article className="p-6 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-3">
          <h2 className="text-base font-semibold text-white">Audio guardado</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            El archivo aceptado permanece en el servidor para reproducirlo después. No es una sesión
            efímera ni una garantía legal de retención cero.
          </p>
        </article>
        <article className="p-6 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-3">
          <h2 className="text-base font-semibold text-white">Segmentos</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Whisper devuelve texto y tiempos. Las etiquetas de hablante de esta versión no identifican
            personas: no hay un modelo de diarización instalado.
          </p>
        </article>
      </div>

      <div className="p-6 md:p-8 rounded-3xl bg-[#0d1425] border border-gray-800 space-y-3">
        <h2 className="text-xl font-display font-bold text-white">Autores</h2>
        <p className="text-sm text-gray-300">Andrey Quiceno, Jhorman Gómez, Iván Ausecha y Alejandro Enciso.</p>
        <a
          href="https://github.com/AndreyQuicenoC/VozNotAI"
          className="inline-block text-sm text-cyan-400 hover:underline"
        >
          Repositorio en GitHub
        </a>
      </div>
    </div>
  );
};
