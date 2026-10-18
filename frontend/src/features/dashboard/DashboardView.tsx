import React, { useState } from "react";
import { useVozNotStore } from "../../services/store.ts";
import { QuickUploadModal } from "../../components/shared/QuickUploadModal.tsx";
import { exportToSrt, exportToPlainText } from "../../utils/transcriptionParsers.ts";

interface DashboardViewProps {
  onNavigate: (path: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { currentUser, sessions, notes, selectSession, deleteSession, usage, engineStatus } = useVozNotStore();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [modeFilter, setModeFilter] = useState<"local" | "cloud">("local");
  const [currentPage, setCurrentPage] = useState(1);

  // Download SRT/TXT for recent sessions
  const handleDownload = (sess: typeof sessions[0], format: "srt" | "txt") => {
    let content = "";
    let mimeType = "text/plain";
    let filename = "";

    if (format === "srt") {
      content = exportToSrt(sess.segments);
      filename = `${sess.title.replace(/\.[^/.]+$/, "")}.srt`;
    } else {
      content = exportToPlainText(sess.segments, sess.title);
      filename = `${sess.title.replace(/\.[^/.]+$/, "")}.txt`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!currentUser) {
    return (
      <div className="rounded-2xl border border-[#24293b] bg-[#191f30] p-8 text-sm text-[#c5c5d7]">
        Inicia sesión para ver tus transcripciones y tu consumo.
      </div>
    );
  }

  const minutesLabel = (usage?.total_audio_minutes ?? 0).toLocaleString("es-CO", {
    maximumFractionDigits: 2,
  });
  const quota = usage?.quota_minutes_assigned ?? currentUser.maxMinutesQuota ?? 0;
  const quotaPercent = quota > 0 ? Math.min(100, usage?.quota_percent_used ?? 0) : 0;
  const estimated = (usage?.estimated_cost_usd ?? 0).toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
  const actualLabel =
    usage?.actual_cost_usd == null ? "No disponible" : `$${usage.actual_cost_usd.toFixed(4)} USD`;

  return (
    <div className="flex flex-col gap-6 max-w-[1720px] mx-auto w-full pb-16 animate-fadeIn">
      {/* 1. Encabezado Ejecutivo y Métricas de Ecosistema */}
      <div className="relative overflow-hidden rounded-2xl bg-[#191f30] p-6 shadow-xl border border-[#24293b]/60">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#48d9e8]/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#7287ff]/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-['Space_Grotesk'] text-2xl lg:text-3xl font-semibold text-[#dde2f9] tracking-tight">
                Bienvenido de nuevo, {currentUser.name} {currentUser.lastName}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#7287ff]/20 text-[#bac3ff] text-xs font-semibold border border-[#7287ff]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#48d9e8]"></span>
                Cliente Profesional (Plan Equipo Eureka)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[#c5c5d7] text-xs">
              <span className="flex items-center gap-1.5 text-[#48d9e8] font-medium">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                {engineStatus?.local_available
                  ? `Motor local ${engineStatus.active_model}: disponible`
                  : engineStatus?.local_error || "Motor local aún no verificado en este equipo"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#48d9e8] text-[#00363b] font-semibold text-sm shadow-md hover:bg-[#89f2ff] transition-all active:scale-95"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:rotate-90">
                add
              </span>
              <span>Nueva Transcripción de Audio</span>
            </button>
            <button
              onClick={() => onNavigate("espacio-de-trabajo")}
              className="p-2.5 rounded-xl bg-[#24293b] text-[#dde2f9] hover:text-[#48d9e8] hover:bg-[#2f3446] transition-colors border border-[#444654]/40"
              title="Abrir Espacio de Trabajo Acústico"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">open_in_full</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Panel de Métricas / KPI Cards (4 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Minutos Procesados */}
        <div className="rounded-xl bg-[#191f30] p-5 shadow-md flex flex-col justify-between gap-4 border border-[#24293b]/60">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-[#c5c5d7]">Minutos de Audio Procesados</span>
              <span className="font-['Space_Grotesk'] text-2xl font-bold text-[#dde2f9] mt-1">
                {minutesLabel} <span className="text-xs font-normal text-[#c5c5d7]">min</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#48d9e8]/10 text-[#48d9e8] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">schedule</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs text-[#c5c5d7]">
              <span>Cuota asignada</span>
              <span className="text-[#dde2f9] font-['Space_Grotesk']">
                {minutesLabel} / {quota > 0 ? `${quota} min` : "sin límite"}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#2f3446] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#48d9e8] to-[#7287ff] rounded-full"
                style={{ width: `${quotaPercent}%` }}
              ></div>
            </div>
            <div className="flex items-center gap-1 text-[#c5c5d7] text-xs pt-0.5">
              <span>{usage?.total_requests ?? 0} solicitudes registradas</span>
            </div>
          </div>
        </div>

        {/* Card 2: Archivos & Espacios */}
        <div className="rounded-xl bg-[#191f30] p-5 shadow-md flex flex-col justify-between gap-4 border border-[#24293b]/60">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-[#c5c5d7]">Archivos & Sesiones Activas</span>
              <span className="font-['Space_Grotesk'] text-2xl font-bold text-[#dde2f9] mt-1">
                {sessions.length} <span className="text-xs font-normal text-[#c5c5d7]">conversaciones</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#7287ff]/10 text-[#bac3ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">folder_managed</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[#c5c5d7] text-xs">
              <span>Notas guardadas</span>
              <span className="text-[#dde2f9] font-semibold">{notes.length}</span>
            </div>
            <p className="text-[11px] text-[#8f8fa0]">
              Local: {(usage?.local_audio_minutes ?? 0).toFixed(2)} min · API: {(usage?.api_audio_minutes ?? 0).toFixed(2)} min
            </p>
          </div>
        </div>

        {/* Card 3: Ahorro por Motor Local */}
        <div className="rounded-xl bg-[#191f30] p-5 shadow-md flex flex-col justify-between gap-4 border border-[#24293b]/60">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-[#c5c5d7]">Costo equivalente estimado</span>
              <span className="font-['Space_Grotesk'] text-2xl font-bold text-[#48d9e8] mt-1">
                ${estimated} <span className="text-xs font-normal text-[#c5c5d7]">USD</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#48d9e8]/10 text-[#48d9e8] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">savings</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs text-[#c5c5d7]">
              <span>{usage?.cost_status_label ?? "Estimado"}</span>
              <span className="text-[#dde2f9] font-['Space_Grotesk']">Real: {actualLabel}</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[#151b2c] border border-[#24293b]/50">
              <span className="material-symbols-outlined text-[#48d9e8] text-[18px]">bolt</span>
              <span className="text-xs text-[#dde2f9] font-medium">El estimado no es una factura del proveedor</span>
            </div>
          </div>
        </div>

        {/* Card 4: Precisión Whisper Large */}
        <div className="rounded-xl bg-[#191f30] p-5 shadow-md flex flex-col justify-between gap-4 border border-[#24293b]/60">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-[#c5c5d7]">Modelo activo</span>
              <span className="font-['Space_Grotesk'] text-2xl font-bold text-[#dde2f9] mt-1">
                {engineStatus?.active_model || "—"}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#cebdff]/10 text-[#cebdff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">psychology</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#c5c5d7]">
                {engineStatus?.ffmpeg_installed ? "FFmpeg detectado" : "FFmpeg no detectado"}
              </span>
              <span className="text-[#cebdff] font-['Space_Grotesk'] font-semibold">
                {engineStatus?.execution_mode === "api" ? "Modo API" : "Modo local"}
              </span>
            </div>
            {/* Sparkline acústica SVG */}
            <div className="h-6 w-full flex items-center">
              <svg className="w-full h-full text-[#cebdff]" fill="none" viewBox="0 0 160 24">
                <path
                  d="M0 12 L15 10 L30 14 L45 8 L60 16 L75 5 L90 12 L105 4 L120 7 L135 2 L160 3"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
                <path
                  d="M0 12 L15 10 L30 14 L45 8 L60 16 L75 5 L90 12 L105 4 L120 7 L135 2 L160 3 L160 24 L0 24 Z"
                  fill="currentColor"
                  fillOpacity="0.15"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Zona de Carga Rápida (Upload Zone) */}
      <div className="rounded-2xl bg-[#191f30] p-6 shadow-lg border border-[#24293b]/60 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-['Space_Grotesk'] text-lg font-semibold text-[#dde2f9] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#48d9e8] text-[22px]">cloud_upload</span>
              Carga y Transcripción Inmediata
            </h2>
            <p className="text-xs text-[#c5c5d7] mt-0.5">
              Sube o arrastra tus archivos de audio para transcripción paralela y generación de resumen inteligente.
            </p>
          </div>

          {/* Mode Selector - Only Admin can toggle */}
          {currentUser.role === "admin" ? (
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#080e1e] self-start border border-[#24293b]/60">
              <button
                onClick={() => setModeFilter("local")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  modeFilter === "local"
                    ? "bg-[#24293b] text-[#48d9e8] shadow-sm font-semibold"
                    : "text-[#c5c5d7] hover:text-[#dde2f9]"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">lock</span>
                <span>Local Seguro (Eureka Core)</span>
              </button>
              <button
                onClick={() => setModeFilter("cloud")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  modeFilter === "cloud"
                    ? "bg-[#24293b] text-[#7287ff] shadow-sm font-semibold"
                    : "text-[#c5c5d7] hover:text-[#dde2f9]"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">bolt</span>
                <span>Nube Ultrarrápida</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#080e1e] self-start border border-[#24293b]/60 text-xs text-[#48d9e8] font-medium">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span>Modo Inferencia: Transcripción Soberana</span>
            </div>
          )}
        </div>

        {/* Interactive Drag & Drop Box */}
        <div
          onClick={() => setIsUploadModalOpen(true)}
          className="relative group cursor-pointer rounded-xl bg-[#151b2c] p-8 flex flex-col items-center justify-center text-center transition-all hover:bg-[#24293b]/80 border-2 border-dashed border-[#24293b] hover:border-[#48d9e8]/50"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#48d9e8]/10 flex items-center justify-center text-[#48d9e8] mb-3 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[32px]">audio_file</span>
          </div>
          <p className="font-['Space_Grotesk'] text-base font-semibold text-[#dde2f9]">
            Arrastra y suelta archivos de audio aquí, o{" "}
            <span className="text-[#48d9e8] underline decoration-[#48d9e8]/40 underline-offset-4 group-hover:decoration-[#48d9e8]">
              explora en tu equipo
            </span>
          </p>
          <p className="text-xs text-[#c5c5d7] mt-1.5 max-w-xl">
            Formatos soportados: WAV, MP3, M4A, FLAC y OGG. La grabación del micrófono se convierte a WAV. Tamaño máximo: 25 MB y 2 minutos.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <span className="px-2.5 py-1 rounded bg-[#191f30] text-[#c5c5d7] font-['Space_Grotesk'] text-xs border border-[#24293b]">
              Límite: 25 MB
            </span>
            <span className="px-2.5 py-1 rounded bg-[#191f30] text-[#c5c5d7] font-['Space_Grotesk'] text-xs border border-[#24293b]">
              Duración: 120 segundos
            </span>
            <span className="px-2.5 py-1 rounded bg-[#191f30] text-[#c5c5d7] font-['Space_Grotesk'] text-xs border border-[#24293b]">
              Motor: el que configuró el servidor
            </span>
          </div>
        </div>
      </div>

      {/* 4. Grid Principal 68 / 32 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Recent Transcriptions Table */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-['Space_Grotesk'] text-lg font-semibold text-[#dde2f9]">
                Transcripciones Recientes
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#191f30] text-[#c5c5d7] font-['Space_Grotesk'] text-xs border border-[#24293b]">
                {sessions.length} archivos
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="p-1.5 rounded-lg hover:bg-[#191f30] text-[#c5c5d7] hover:text-[#dde2f9] transition-colors"
                title="Nueva Carga"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
              <button
                onClick={() => onNavigate("espacio-de-trabajo")}
                className="p-1.5 rounded-lg hover:bg-[#191f30] text-[#c5c5d7] hover:text-[#dde2f9] transition-colors"
                title="Abrir Espacio de Trabajo"
              >
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-xl bg-[#191f30] overflow-hidden shadow-md border border-[#24293b]/60">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#24293b] text-[#c5c5d7] uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4" scope="col">
                      Archivo y Origen
                    </th>
                    <th className="py-3 px-3" scope="col">
                      Duración
                    </th>
                    <th className="py-3 px-3" scope="col">
                      Fecha/Hora
                    </th>
                    <th className="py-3 px-3" scope="col">
                      Modo
                    </th>
                    <th className="py-3 px-3" scope="col">
                      Notas
                    </th>
                    <th className="py-3 px-3" scope="col">
                      Estado
                    </th>
                    <th className="py-3 px-4 text-right" scope="col">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24293b]/50 text-[#dde2f9]">
                  {sessions.slice(0, 4).map((sess, idx) => (
                    <tr key={sess.id} className="hover:bg-[#24293b]/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              idx === 0
                                ? "bg-[#48d9e8]/15 text-[#48d9e8]"
                                : idx === 1
                                ? "bg-[#7287ff]/15 text-[#bac3ff]"
                                : idx === 2
                                ? "bg-[#cebdff]/15 text-[#cebdff]"
                                : "bg-[#2f3446] text-[#c5c5d7]"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {idx === 0 ? "mic" : idx === 1 ? "headphones" : idx === 2 ? "graphic_eq" : "podcasts"}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-[#dde2f9] truncate max-w-[200px] sm:max-w-xs">
                              {sess.title}
                            </span>
                            <span className="text-[11px] text-[#c5c5d7]">Espacio: {sess.space}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-['Space_Grotesk'] text-[#c5c5d7] whitespace-nowrap">
                        {sess.formattedDuration}
                      </td>
                      <td className="py-3.5 px-3 font-['Space_Grotesk'] text-[#c5c5d7] whitespace-nowrap">
                        {sess.createdAt}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-[#080e1e] text-[#48d9e8] text-[11px] font-medium flex items-center gap-1 w-fit border border-[#48d9e8]/20">
                          <span className="material-symbols-outlined text-[12px]">shield</span>
                          {sess.mode}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-['Space_Grotesk'] text-[#cebdff]">{sess.notesCount} notas</span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {sess.status === "Procesando" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#48d9e8]/10 text-[#48d9e8] text-[11px] font-medium">
                            <svg
                              className="animate-spin h-3.5 w-3.5 text-[#48d9e8]"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                d="M4 12a8 8 0 018-8v8H4z"
                                fill="currentColor"
                              ></path>
                            </svg>
                            Diarizando {sess.progressPercentage || 82}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 text-[11px] font-medium border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Completado
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              selectSession(sess.id);
                              onNavigate("espacio-de-trabajo");
                            }}
                            className="p-1.5 rounded-lg hover:bg-[#24293b] text-[#c5c5d7] hover:text-[#48d9e8] transition-colors"
                            title="Abrir en Editor en Vivo"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit_note</span>
                          </button>
                          <button
                            onClick={() => handleDownload(sess, "srt")}
                            className="p-1.5 rounded-lg hover:bg-[#24293b] text-[#c5c5d7] hover:text-[#dde2f9] transition-colors"
                            title="Descargar SRT"
                          >
                            <span className="material-symbols-outlined text-[18px]">file_download</span>
                          </button>
                          <button
                            onClick={() => deleteSession(sess.id)}
                            className="p-1.5 rounded-lg hover:bg-[#24293b] text-[#c5c5d7] hover:text-[#ffb4ab] transition-colors"
                            title="Eliminar Transcripción"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-[#24293b]/50 flex items-center justify-between text-[#c5c5d7] text-xs">
              <span>Mostrando 4 de {sessions.length} transcripciones archivadas</span>
              <div className="flex items-center gap-1 font-['Space_Grotesk']">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1 rounded bg-[#191f30] hover:bg-[#2f3446] text-[#dde2f9] transition-colors disabled:opacity-40"
                >
                  Anterior
                </button>
                <button className="px-2 py-1 rounded bg-[#48d9e8] text-[#00363b] font-bold">1</button>
                <button className="px-2 py-1 rounded bg-[#191f30] hover:bg-[#2f3446] text-[#dde2f9] transition-colors">
                  2
                </button>
                <button className="px-2 py-1 rounded bg-[#191f30] hover:bg-[#2f3446] text-[#dde2f9] transition-colors">
                  3
                </button>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-2 py-1 rounded bg-[#191f30] hover:bg-[#2f3446] text-[#dde2f9] transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Smart Notes Feed & Tech Docs */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Feed de Últimas Notas Inteligentes */}
          <div className="rounded-xl bg-[#191f30] p-5 shadow-md flex flex-col gap-4 border border-[#24293b]/60">
            <div className="flex items-center justify-between">
              <h3 className="font-['Space_Grotesk'] text-base font-semibold text-[#dde2f9] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#cebdff] text-[20px]">auto_awesome</span>
                Últimas Notas Inteligentes
              </h3>
              <button
                onClick={() => onNavigate("notas-inteligentes")}
                className="text-xs text-[#48d9e8] hover:underline font-medium"
              >
                Ver todas
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {notes.slice(0, 3).map((note) => (
                <div
                  key={note.id}
                  onClick={() => {
                    selectSession(note.sessionId);
                    onNavigate("espacio-de-trabajo");
                  }}
                  className="p-3 rounded-lg bg-[#151b2c] hover:bg-[#24293b] transition-colors flex flex-col gap-1.5 cursor-pointer border border-[#24293b]/40"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        note.category === "Resumen Ejecutivo"
                          ? "bg-[#cebdff]/15 text-[#cebdff]"
                          : note.category === "Acción Pendiente"
                          ? "bg-[#48d9e8]/15 text-[#48d9e8]"
                          : "bg-[#7287ff]/15 text-[#bac3ff]"
                      }`}
                    >
                      {note.category}
                    </span>
                    <span className="font-['Space_Grotesk'] text-[11px] text-[#c5c5d7]">{note.createdAt}</span>
                  </div>
                  <p className="text-xs text-[#dde2f9] line-clamp-2 leading-relaxed">"{note.content}"</p>
                  <div className="flex items-center justify-between text-[#c5c5d7] text-[11px] pt-1">
                    <span className="truncate max-w-[180px]">{note.audioTitle}</span>
                    <span className="font-['Space_Grotesk'] text-[#48d9e8] font-medium">
                      @ {note.timestampFormatted}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tarjeta de Documentación y GitHub del Creador */}
          <div className="rounded-xl bg-[#191f30] p-5 shadow-md flex flex-col gap-3.5 border border-[#24293b]/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#24293b] text-[#48d9e8] flex items-center justify-center shrink-0 border border-[#48d9e8]/20">
                <span className="material-symbols-outlined text-[24px]">terminal</span>
              </div>
              <div className="flex flex-col">
                <span className="font-['Space_Grotesk'] text-sm font-semibold text-[#dde2f9]">
                  VozNotAI Enterprise
                </span>
                <span className="text-xs text-[#c5c5d7]">ClustLayer / Eureka Ecosystem</span>
              </div>
            </div>
            <p className="text-xs text-[#c5c5d7] leading-relaxed">
              Arquitectura de transcripción local zero-trust desarrollada por{" "}
              <strong className="text-[#dde2f9]">Andrey Quiceno</strong>. Consulta la guía técnica de comandos, atajos
              de scrubbing y control de modelos.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => onNavigate("manual")}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#24293b] hover:bg-[#2f3446] text-[#dde2f9] text-xs font-medium transition-colors border border-[#444654]/40"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#48d9e8]">menu_book</span>
                  Manual de Usuario y Atajos
                </span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
              <a
                href="https://github.com/AndreyQuicenoC"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#151b2c] hover:bg-[#24293b] text-[#c5c5d7] hover:text-[#48d9e8] text-xs font-medium transition-colors border border-[#24293b]"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">code</span>
                  GitHub de Andrey Quiceno
                </span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Floating Quick Action Button (Water Drop FAB) */}
      <div className="fixed bottom-8 right-8 z-40 group">
        <button
          onClick={() => setIsUploadModalOpen(true)}
          aria-label="Nueva Transcripción Rápida"
          className="w-14 h-14 rounded-full bg-gradient-to-r from-[#48d9e8] to-[#7287ff] flex items-center justify-center text-[#00105b] shadow-[0_8px_32px_-4px_rgba(10,16,32,0.8),0_0_1px_1px_rgba(72,217,232,0.4)] hover:brightness-110 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-[#48d9e8]"
          type="button"
        >
          <span
            className="material-symbols-outlined text-[26px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            water_drop
          </span>
        </button>
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-[#24293b] px-3 py-1.5 rounded-lg shadow-xl text-xs text-[#dde2f9] whitespace-nowrap border border-[#48d9e8]/30">
          Nueva Transcripción Rápida
        </div>
      </div>

      {/* Upload Modal */}
      <QuickUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={(sess) => {
          selectSession(sess.id);
          onNavigate("workspace");
        }}
      />
    </div>
  );
};
