import React, { useState, useEffect } from "react";
import { useVozNotStore } from "../../services/store.ts";
import { loadBalancer, type SystemInferenceMode } from "../../services/loadBalancer.ts";

export const AiConfigView: React.FC = () => {
  const { currentUser, settings, updateSettings, engineStatus } = useVozNotStore();
  const isAdmin = currentUser?.role === "admin";

  const [lbState, setLbState] = useState(loadBalancer.getState());
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Admin states
  const [systemMode, setSystemMode] = useState<SystemInferenceMode>(lbState.systemMode);
  const [algorithm, setAlgorithm] = useState<"least_connections" | "round_robin">(lbState.algorithm);
  const [apiEndpoint, setApiEndpoint] = useState(lbState.apiEndpointConfig.endpointUrl);
  const [apiProvider, setApiProvider] = useState(lbState.apiEndpointConfig.provider);
  const [whisperModel, setWhisperModel] = useState(settings.whisperModel);

  // User personal states
  const [preferredLang, setPreferredLang] = useState("auto");
  const [autoPunctuation, setAutoPunctuation] = useState(true);
  const [longAudioNotify, setLongAudioNotify] = useState(true);

  useEffect(() => {
    return loadBalancer.subscribe(() => {
      setLbState(loadBalancer.getState());
    });
  }, []);

  const handleSaveAdminConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    loadBalancer.setSystemMode(systemMode, "admin");
    loadBalancer.setAlgorithm(algorithm, "admin");
    loadBalancer.configureApiEndpoint(
      { endpointUrl: apiEndpoint, provider: apiProvider },
      "admin"
    );
    updateSettings({ whisperModel });

    setSaveToast("Configuración del Clúster e Inferencia del Sistema actualizada exitosamente.");
    setTimeout(() => setSaveToast(null), 4000);
  };

  const handleSaveUserConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveToast("El idioma y las alertas personales no se guardan: el motor lo define el servidor.");
    setTimeout(() => setSaveToast(null), 4000);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Toast Alert */}
      {saveToast && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center gap-3 shadow-xl backdrop-blur-md animate-fade-in">
          <span className="material-symbols-outlined text-cyan-400">check_circle</span>
          <span className="text-xs font-medium">{saveToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-[#11192e] to-[#121c33] border border-cyan-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1">
            <span className="material-symbols-outlined text-sm">neurology</span>
            {isAdmin ? "Panel Maestro de Inferencia & Balanceador" : "Preferencias de Transcripción"}
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            Configuración del Motor de IA
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            {isAdmin
              ? "Control exclusivo para administradores: asigna el motor del sistema (Local CUDA balanceado o API Cloud), gestiona los nodos de GPU y ajusta las políticas de distribución."
              : "El motor, el modelo y FFmpeg los define el servidor. Esta cuenta no cambia ese ajuste."}
          </p>
        </div>

        {isAdmin && (
          <div className="px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">shield</span>
            Control Maestro de Clúster
          </div>
        )}
      </div>

      {/* ADMIN VIEW: Master Inference Mode & Load Balancer */}
      {isAdmin ? (
        <form onSubmit={handleSaveAdminConfig} className="space-y-6">
          {/* Section 1: System-wide Inference Mode */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Modo de Inferencia Global para Todos los Usuarios
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Los usuarios estándar no pueden modificar este ajuste; se aplicará de forma
                  autoritativa a todas las sesiones.
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                {systemMode}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {[
                {
                  id: "local_balanced" as SystemInferenceMode,
                  title: "Local CUDA Balanceado",
                  badge: "Recomendado",
                  desc: "Distribuye la carga entre los nodos GPU locales (RTX 4090 / 3090). Máxima privacidad zero-data y costo $0.00.",
                  icon: "developer_board",
                },
                {
                  id: "cloud_api" as SystemInferenceMode,
                  title: "API Cloud Failover",
                  badge: "Gateway Listo",
                  desc: "Enruta hacia el proveedor de API externo configurado. Listo para operar en cuanto suministres la clave.",
                  icon: "cloud_sync",
                },
                {
                  id: "hybrid_failover" as SystemInferenceMode,
                  title: "Híbrido Inteligente",
                  badge: "Auto-Scale",
                  desc: "Prioriza los GPUs locales y redirige a la API solo si la cola local supera la capacidad de concurrencia.",
                  icon: "dynamic_feed",
                },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSystemMode(m.id)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer space-y-3 ${
                    systemMode === m.id
                      ? "bg-[#15203b] border-cyan-400 shadow-lg shadow-cyan-950/40"
                      : "bg-[#111728] border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="material-symbols-outlined text-cyan-400 text-xl">{m.icon}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1e2a4a] text-cyan-300 border border-cyan-500/30">
                      {m.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{m.title}</h3>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Load Balancer Algorithms & Worker Telemetry */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400">tune</span>
              Algoritmo de Balanceo & Nodos de Trabajo
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#131b2e] border border-gray-800 space-y-2">
                <label className="text-xs font-semibold text-white block">
                  Política de Despacho de Trabajos
                </label>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value as any)}
                  className="w-full bg-[#18233e] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="least_connections">Least Connections (Asigna al worker con menor carga activa)</option>
                  <option value="round_robin">Round Robin (Distribución cíclica equitativa entre GPUs)</option>
                </select>
                <p className="text-[11px] text-gray-400">
                  Previene la sobrecarga térmica y saturación de VRAM en inferencias simultáneas.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#131b2e] border border-gray-800 space-y-2">
                <label className="text-xs font-semibold text-white block">
                  Modelo Whisper Predeterminado para el Clúster
                </label>
                <select
                  value={whisperModel}
                  onChange={(e) => setWhisperModel(e.target.value as any)}
                  className="w-full bg-[#18233e] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="whisper-large-v3">Whisper Large v3 (1550M params • Precisión Forense)</option>
                  <option value="whisper-turbo">Whisper Turbo (809M params • 12x tiempo real)</option>
                  <option value="whisper-medium">Whisper Medium (769M params • Equilibrado)</option>
                  <option value="whisper-base">Whisper Base (74M params • Ultraligero)</option>
                </select>
                <p className="text-[11px] text-gray-400">
                  Los pesos se encuentran pre-cargados en la memoria VRAM del nodo Eureka-01.
                </p>
              </div>
            </div>

            {/* Workers status cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {lbState.workers.map((w) => (
                <div key={w.id} className="p-4 rounded-xl bg-[#111726] border border-gray-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${w.status === "online" ? "bg-emerald-400" : "bg-cyan-400"}`}></span>
                      <span className="text-xs font-semibold text-white">{w.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono">({w.device})</span>
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      VRAM: {w.vramUsedGb} / {w.vramTotalGb} GB • Temp: {w.temperatureC}°C • Latencia: {w.avgLatencyMs}ms
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-cyan-400">{w.activeJobs}/{w.maxConcurrency}</div>
                    <span className="text-[10px] text-gray-500">Concurrencia</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Cloud API Gateway Config */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400">cloud</span>
              Configuración de Gateway API Cloud (Listo para Failover)
            </h2>
            <p className="text-xs text-gray-400">
              La arquitectura del cliente API está completamente preparada. En cuanto suministres tu
              clave de API, el balanceador podrá activar el enrutamiento directo.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-gray-400 block mb-1">Proveedor de API:</label>
                <select
                  value={apiProvider}
                  onChange={(e) => setApiProvider(e.target.value as any)}
                  className="w-full bg-[#18233e] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Whisper Cloud OpenAI">Whisper Cloud (OpenAI standard)</option>
                  <option value="Groq Whisper">Groq Cloud Whisper (LPUs ultrarrápidas)</option>
                  <option value="Custom Sovereign Gateway">Gateway Soberano Corporativo</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-gray-400 block mb-1">Endpoint de Inferencia:</label>
                <input
                  type="text"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  className="w-full bg-[#18233e] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs tracking-wider uppercase transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              Guardar Configuración Maestra del Clúster
            </button>
          </div>
        </form>
      ) : (
        /* REGULAR USER VIEW: Only Operator Transcription Preferences */
        <form onSubmit={handleSaveUserConfig} className="p-6 md:p-8 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-6 shadow-xl">
          <div className="p-4 rounded-xl bg-[#131b2e] border border-gray-800 text-xs text-gray-300 flex items-center gap-3">
            <span className="material-symbols-outlined text-cyan-400 text-xl">verified_user</span>
            <div>
              <strong className="text-white block">Motor del servidor:</strong>
              {engineStatus
                ? ` ${engineStatus.execution_mode === "api" ? "API remota" : "Whisper local"} · modelo ${engineStatus.active_model || "no informado"} · FFmpeg ${engineStatus.ffmpeg_installed ? "disponible" : "no detectado"}.`
                : " Aún no hay estado del motor. Recarga la sesión si este aviso permanece."}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1">
                Idioma Preferido de Transcripción:
              </label>
              <select
                value={preferredLang}
                onChange={(e) => setPreferredLang(e.target.value)}
                className="w-full max-w-md bg-[#18233e] border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="auto">Detección Automática Inteligente (Recomendado)</option>
                <option value="es">Español (América Latina / España)</option>
                <option value="en">Inglés (Global)</option>
                <option value="pt">Portugués</option>
                <option value="fr">Francés</option>
              </select>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={autoPunctuation}
                  onChange={(e) => setAutoPunctuation(e.target.checked)}
                  className="rounded border-gray-700 bg-[#18233e] text-cyan-500 focus:ring-0"
                />
                <span>Habilitar puntuación gramatical y mayúsculas automáticas en los párrafos</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={longAudioNotify}
                  onChange={(e) => setLongAudioNotify(e.target.checked)}
                  className="rounded border-gray-700 bg-[#18233e] text-cyan-500 focus:ring-0"
                />
                <span>Notificarme cuando una transcripción de más de 30 minutos finalice</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-800">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
            >
              Guardar Mis Preferencias
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
