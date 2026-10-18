import React, { useState } from "react";

interface AboutViewProps {
  onNavigate: (path: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  const [activeModel, setActiveModel] = useState<"large" | "turbo" | "medium">("large");

  const modelSpecs = {
    large: {
      name: "Whisper Large v3",
      params: "1,550 Millones",
      vram: "6.2 GB VRAM",
      accuracy: "99.2% (Términos Médicos & Legales)",
      speed: "4.8x Tiempo Real",
      desc: "El estándar de oro para investigaciones clínicas, declaraciones judiciales y auditorías donde cada fonema importa.",
    },
    turbo: {
      name: "Whisper Turbo",
      params: "809 Millones",
      vram: "3.1 GB VRAM",
      accuracy: "97.8% (Conversaciones Generales)",
      speed: "12.4x Tiempo Real",
      desc: "Optimizado para latencia ultrabaja en flujos continuos y reuniones operativas de gran volumen.",
    },
    medium: {
      name: "Whisper Medium",
      params: "769 Millones",
      vram: "2.8 GB VRAM",
      accuracy: "96.5% (Alta Fidelidad)",
      speed: "8.2x Tiempo Real",
      desc: "Balance perfecto para nodos locales de recursos compartidos o estaciones de trabajo móviles.",
    },
  };

  return (
    <div className="space-y-12 animate-fade-in pb-16">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0c1322] via-[#09101d] to-[#121d36] border border-cyan-500/20 p-8 md:p-14 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-cyan-500/10 to-blue-600/5 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            MANIFIESTO DE SOBERANÍA ACÚSTICA • CLUSTLAYER & EUREKA
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight">
            Transcripción de Alta Fidelidad sin Ceder la Custodia de tus Datos.
          </h1>

          <p className="text-sm md:text-base text-gray-300 leading-relaxed">
            VozNotAI nace como respuesta a la necesidad imperativa de procesar audios sensibles,
            reuniones directivas, diagnósticos clínicos y declaraciones forenses sin enviar
            grabaciones a servidores corporativos externos ni exponerlas al entrenamiento de
            modelos comerciales.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={() => onNavigate("workspace")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              Comenzar a Transcribir Ahora
            </button>
            <button
              onClick={() => onNavigate("dashboard")}
              className="px-6 py-3 rounded-xl bg-[#151f38] hover:bg-[#1e2c4d] border border-gray-700 text-gray-200 text-xs font-medium transition-all cursor-pointer"
            >
              Ver Panel Operativo
            </button>
          </div>
        </div>
      </div>

      {/* 3 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <span className="material-symbols-outlined text-2xl">memory</span>
          </div>
          <h3 className="text-base font-semibold text-white">Inferencia Local por CUDA</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Los pesos del modelo Whisper se cargan en la VRAM de tu nodo TensorRT (Eureka-01),
            ejecutando en hardware soberano con aceleración FP16 sin transferencias fuera de red.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <span className="material-symbols-outlined text-2xl">shield</span>
          </div>
          <h3 className="text-base font-semibold text-white">Garantía Zero-Knowledge</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Las pistas de audio nunca se utilizan para fine-tuning o reentrenamiento. Toda sesión se
            encapsula en memoria efímera y se sella criptográficamente para auditoría.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <span className="material-symbols-outlined text-2xl">record_voice_over</span>
          </div>
          <h3 className="text-base font-semibold text-white">Diarización Espectral</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Algoritmos PyAnnote con embeddings de voz permiten separar e identificar interlocutores
            con exactitud milimétrica incluso en grabaciones con múltiples solapamientos.
          </p>
        </div>
      </div>

      {/* Model Benchmark Interactive Selector */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#0d1425] border border-gray-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-display font-bold text-white">
              Modelos Whisper Soportados en el Clúster
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Selecciona una variante para analizar sus especificaciones técnicas de inferencia.
            </p>
          </div>

          <div className="flex bg-[#141d33] p-1 rounded-xl border border-gray-800">
            {(["large", "turbo", "medium"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setActiveModel(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                  activeModel === m
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Model Card */}
        <div className="p-6 rounded-2xl bg-[#11192e] border border-cyan-500/20 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="text-[11px] font-mono text-gray-400 uppercase">Arquitectura</div>
            <div className="text-lg font-bold text-white">{modelSpecs[activeModel].name}</div>
            <div className="text-xs text-cyan-400 font-mono">{modelSpecs[activeModel].params}</div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-mono text-gray-400 uppercase">Requisito VRAM</div>
            <div className="text-lg font-bold text-cyan-300">{modelSpecs[activeModel].vram}</div>
            <div className="text-xs text-gray-400">FP16 CUDA Optimized</div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-mono text-gray-400 uppercase">Precisión Fonética</div>
            <div className="text-lg font-bold text-emerald-400">
              {modelSpecs[activeModel].accuracy}
            </div>
            <div className="text-xs text-gray-400">Word Error Rate (WER) bajo</div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-mono text-gray-400 uppercase">Velocidad Inferencia</div>
            <div className="text-lg font-bold text-purple-400">{modelSpecs[activeModel].speed}</div>
            <div className="text-xs text-gray-400">En GPU RTX 4090</div>
          </div>
        </div>

        <p className="text-xs text-gray-300 italic bg-[#090f1b] p-4 rounded-xl border border-gray-800/80">
          "{modelSpecs[activeModel].desc}"
        </p>
      </div>

      {/* Comparison Table: Sovereign Whisper vs Third Party Cloud */}
      <div className="rounded-2xl bg-[#0f172a] border border-gray-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-base font-semibold text-white">
            Matriz Comparativa: VozNotAI Local vs APIs Comerciales en la Nube
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0b101e] text-gray-400 font-mono uppercase text-[11px] border-b border-gray-800">
                <th className="p-4">Criterio Crítico</th>
                <th className="p-4 text-cyan-400">VozNotAI (Local CUDA / ClustLayer)</th>
                <th className="p-4 text-gray-400">APIs Cloud de Terceros</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-gray-300">
              <tr>
                <td className="p-4 font-semibold text-white">Privacidad y Custodia Legal</td>
                <td className="p-4 text-emerald-400 flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  100% en infraestructura propia (HIPAA/GDPR compliant)
                </td>
                <td className="p-4 text-red-400">
                  Transmitido por internet a data centers externos
                </td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">Costo Marginal por Audio</td>
                <td className="p-4 text-emerald-400 flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  $0.00 USD (Costo fijo amortizado de energía local)
                </td>
                <td className="p-4 text-gray-400">
                  $0.006 a $0.024 USD por minuto recurrente
                </td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">Diarización de Locutores</td>
                <td className="p-4 text-emerald-400 flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Nativa con PyAnnote + timestamps por palabra
                </td>
                <td className="p-4 text-gray-400">
                  Costo adicional o ausente en modelos base
                </td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">Alineación Acústica de Precisión</td>
                <td className="p-4 text-emerald-400 flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Scrubbing en tiempo real con Web Audio API
                </td>
                <td className="p-4 text-gray-400">
                  Dependiente de conexión y latencia de red
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
