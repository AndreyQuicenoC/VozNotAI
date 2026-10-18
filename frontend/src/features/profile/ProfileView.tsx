import React, { useState } from "react";
import { useVozNotStore } from "../../services/store.ts";
import { calculateSavingsUSD } from "../../utils/costCalculator.ts";

export const ProfileView: React.FC = () => {
  const { currentUser, settings, updateSettings, updateUser } = useVozNotStore();

  const [activeTab, setActiveTab] = useState<"general" | "ai" | "usage" | "security">("general");

  // Editable user fields
  const [name, setName] = useState(currentUser?.name || "Dr. Adolfo");
  const [lastName, setLastName] = useState(currentUser?.lastName || "Quiceno");
  const [org, setOrg] = useState("ClustLayer • Eureka BioCluster");
  const [dept, setDept] = useState("División de Inteligencia Acústica & Salud");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // AI settings
  const [preferredModel, setPreferredModel] = useState(settings.whisperModel);
  const [diarization, setDiarization] = useState(settings.diarizationEnabled);
  const [noiseFilter, setNoiseFilter] = useState(settings.noiseSuppression);
  const [beamSize, setBeamSize] = useState(5);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await updateUser({ name, lastName, phone: currentUser?.phone });
    if (saved) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleSaveAISettings = () => {
    updateSettings({
      whisperModel: preferredModel,
      diarizationEnabled: diarization,
      noiseSuppression: noiseFilter,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-gray-400">
        Inicia sesión para gestionar tu perfil de operador.
      </div>
    );
  }

  const quotaPercent = Math.min(
    100,
    Math.round((currentUser.minutesUsed / currentUser.monthlyQuota) * 100)
  );

  const savings = calculateSavingsUSD(currentUser.minutesUsed);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Toast Alert */}
      {saveSuccess && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-3 shadow-xl backdrop-blur-md animate-fade-in">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <span className="text-xs font-medium">Configuración guardada satisfactoriamente.</span>
        </div>
      )}

      {/* Profile Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-[#11192e] via-[#0e1629] to-[#121c33] border border-cyan-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-20 h-20 rounded-2xl border-2 border-cyan-500/40 object-cover shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-[#0e1629] rounded-full"></span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold text-white tracking-tight">
                  {currentUser.name} {currentUser.lastName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono border uppercase bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-gray-400">{currentUser.email}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-mono pt-1">
                <span className="material-symbols-outlined text-[14px] text-cyan-400">domain</span>
                {org}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[11px] font-mono text-gray-400 uppercase">Rol</div>
              <div className="text-xs font-semibold text-cyan-300 font-mono">
                {currentUser.roleTitle}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800/80 gap-6 mt-8 overflow-x-auto text-xs font-medium">
          {[
            { id: "general", label: "Información General", icon: "badge" },
            { id: "ai", label: "Preferencias de IA & Whisper", icon: "psychology" },
            { id: "usage", label: "Consumo & Ahorro", icon: "data_usage" },
            { id: "security", label: "Seguridad & Sesiones", icon: "shield_lock" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-cyan-400 text-cyan-400 font-semibold"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: General Info */}
      {activeTab === "general" && (
        <form
          onSubmit={handleSaveGeneral}
          className="p-6 md:p-8 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-6 shadow-xl"
        >
          <div>
            <h2 className="text-base font-semibold text-white">Datos de Operador Forense</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Información visible en los certificados de auditoría acústica emitidos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1">Nombre:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#18233e] border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1">Apellidos:</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-[#18233e] border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1">Organización / Tenant:</label>
              <input
                type="text"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                className="w-full bg-[#18233e] border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1">Departamento:</label>
              <input
                type="text"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full bg-[#18233e] border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-800">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer shadow-md shadow-cyan-500/20"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: AI Preferences */}
      {activeTab === "ai" && (
        <div className="p-6 md:p-8 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-6 shadow-xl">
          <div>
            <h2 className="text-base font-semibold text-white">Parámetros del Motor Whisper & CUDA</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Personaliza la arquitectura del pipeline acústico para tus sesiones de transcripción.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#141d33] border border-gray-800 space-y-2">
                <label className="text-xs font-semibold text-white block">Modelo Whisper Predilecto</label>
                <select
                  value={preferredModel}
                  onChange={(e) => setPreferredModel(e.target.value as any)}
                  className="w-full bg-[#1b2642] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="whisper-large-v3">Whisper Large v3 (1550M params • 82% Precisión Médica)</option>
                  <option value="whisper-turbo">Whisper Turbo (809M params • 12x tiempo real)</option>
                  <option value="whisper-medium">Whisper Medium (769M params • Baja latencia)</option>
                  <option value="whisper-base">Whisper Base (74M params • Prototipado rápido)</option>
                </select>
                <p className="text-[11px] text-gray-400">
                  Se ejecutará prioritariamente en la memoria VRAM del GPU RTX 4090 local.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#141d33] border border-gray-800 space-y-2">
                <label className="text-xs font-semibold text-white block">Beam Search Size ({beamSize})</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={beamSize}
                  onChange={(e) => setBeamSize(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
                <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                  <span>1 (Greedy / Ultra Rápido)</span>
                  <span className="text-cyan-400">Actual: {beamSize}</span>
                  <span>10 (Exhaustivo)</span>
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#141d33] border border-gray-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Diarización Acústica (PyAnnote)</div>
                  <div className="text-[11px] text-gray-400">
                    Separación espectral automática por locutores (Speaker 1, 2, etc.)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDiarization(!diarization)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                    diarization
                      ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                      : "bg-gray-800 border-gray-700 text-gray-400"
                  }`}
                >
                  {diarization ? "Activada" : "Desactivada"}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#141d33] border border-gray-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Supresión Neural de Ruido</div>
                  <div className="text-[11px] text-gray-400">
                    Filtro RNNoise en tiempo real antes de pasar al encoder Whisper
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNoiseFilter(!noiseFilter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                    noiseFilter
                      ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                      : "bg-gray-800 border-gray-700 text-gray-400"
                  }`}
                >
                  {noiseFilter ? "Activo" : "Inactivo"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-800">
            <button
              onClick={handleSaveAISettings}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer shadow-md shadow-cyan-500/20"
            >
              Actualizar Preferencias de Inferencia
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Usage and Quota */}
      {activeTab === "usage" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-2">
              <span className="text-xs font-mono text-gray-400 uppercase">Minutos Utilizados</span>
              <div className="text-3xl font-bold font-mono text-white">
                {currentUser.minutesUsed} <span className="text-sm font-normal text-gray-400">/ {currentUser.monthlyQuota} min</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${quotaPercent}%` }}></div>
              </div>
              <p className="text-[11px] text-gray-400">{quotaPercent}% consumido de tu ciclo mensual.</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-2">
              <span className="text-xs font-mono text-gray-400 uppercase">Ahorro vs Nube Comercial</span>
              <div className="text-3xl font-bold font-mono text-emerald-400">
                ${savings.savingsUSD.toFixed(2)} USD
              </div>
              <p className="text-[11px] text-gray-400">
                Calculado contra tarifa estándar de $0.006 USD/minuto por API de terceros.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-2">
              <span className="text-xs font-mono text-gray-400 uppercase">Eficiencia Energética</span>
              <div className="text-3xl font-bold font-mono text-purple-400">0.021 kWh</div>
              <p className="text-[11px] text-gray-400">
                Inferencia CUDA local altamente optimizada con arquitectura Eureka-01.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security & Sessions */}
      {activeTab === "security" && (
        <div className="p-6 md:p-8 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-6 shadow-xl">
          <div>
            <h2 className="text-base font-semibold text-white">Sesiones Activas & Políticas Zero-Trust</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Monitoreo de llaves criptográficas de sesión y auditoría de accesos al nodo.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                id: "sess_1",
                device: "Google Chrome 134 • macOS Sequoia",
                ip: "192.168.1.104 (Red Interna ClustLayer)",
                current: true,
                time: "Activa ahora mismo",
              },
              {
                id: "sess_2",
                device: "VozNotAI CLI Worker • Ubuntu 24.04 LTS",
                ip: "10.0.4.12 (Eureka Node 01)",
                current: false,
                time: "Iniciado hace 3 horas",
              },
            ].map((sess) => (
              <div
                key={sess.id}
                className="p-4 rounded-xl bg-[#141d33] border border-gray-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-cyan-400 text-xl">
                    {sess.device.includes("Ubuntu") ? "terminal" : "laptop_mac"}
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      {sess.device}
                      {sess.current && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Esta Sesión
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono">{sess.ip} • {sess.time}</div>
                  </div>
                </div>

                {!sess.current && (
                  <button className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium cursor-pointer">
                    Cerrar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
