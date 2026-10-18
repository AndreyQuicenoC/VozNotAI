import React, { useState, useEffect, useRef } from "react";
import { useVozNotStore } from "../../services/store.ts";
import { useAudioPlayback } from "../../services/audioPlayer.ts";
import { QuickUploadModal } from "../../components/shared/QuickUploadModal.tsx";
import {
  exportToSrt,
  exportToWebVtt,
  exportToPlainText,
  exportToJson,
  searchTranscript,
} from "../../utils/transcriptionParsers.ts";
import { formatFileSize, formatInferenceCost } from "../../utils/costCalculator.ts";

interface WorkspaceViewProps {
  onNavigate: (path: string) => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = () => {
  const {
    sessions,
    activeSession,
    selectSession,
    updateSession,
    notes,
    addNote,
    currentUser,
    settings,
    updateSettings,
    updateUser,
    refresh,
  } = useVozNotStore();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const processing = sessions.some((session) => session.status === "Procesando");
  useEffect(() => {
    if (!processing) return;
    const timer = window.setInterval(() => {
      void refresh();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [processing, refresh]);
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState<"hoy" | "semana" | "fijadas">("hoy");
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);

  // Editable session title
  const [titleInput, setTitleInput] = useState(activeSession?.title || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Note creator state
  const [noteContent, setNoteContent] = useState("");
  const [noteCategory, setNoteCategory] = useState<
    "Resumen Ejecutivo" | "Acción Pendiente" | "Idea Clave" | "Decisión Crítica" | "Infraestructura"
  >("Decisión Crítica");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Playback engine attached to active session duration
  const {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    formattedCurrentTime,
    formattedDuration,
    togglePlay,
    seekTo,
    skipSeconds,
    setPlaybackRate,
    setVolume,
  } = useAudioPlayback(activeSession?.durationSeconds || 0, activeSession?.audioUrl);

  const transcriptFeedRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync title input with active session
  useEffect(() => {
    if (activeSession) {
      setTitleInput(activeSession.title);
    }
  }, [activeSession?.id]);

  // Keyboard shortcuts: Space for Play/Pause, Shift+Left/Right for ±5s, Ctrl+N for new note focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if (e.code === "Space" && !isInput) {
        e.preventDefault();
        togglePlay();
      } else if (e.shiftKey && e.key === "ArrowLeft" && !isInput) {
        e.preventDefault();
        skipSeconds(-5);
      } else if (e.shiftKey && e.key === "ArrowRight" && !isInput) {
        e.preventDefault();
        skipSeconds(5);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        const noteArea = document.getElementById("workspace-note-input");
        noteArea?.focus();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchBox = document.getElementById("session-search-input");
        searchBox?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, skipSeconds]);

  // Search in transcript
  const searchResults = searchTranscript(activeSession?.segments || [], transcriptSearch);

  // Export handlers
  const handleExport = (type: "txt" | "srt" | "vtt" | "json" | "pdf") => {
    const filenameBase = activeSession?.title.replace(/\.[^/.]+$/, "") || "Transcripcion_VozNotAI";
    let content = "";
    let mimeType = "text/plain";
    let ext = "txt";

    if (type === "txt") {
      content = exportToPlainText(activeSession?.segments || [], activeSession?.title || "");
      ext = "txt";
      mimeType = "text/plain";
    } else if (type === "srt") {
      content = exportToSrt(activeSession?.segments || []);
      ext = "srt";
      mimeType = "application/x-subrip";
    } else if (type === "vtt") {
      content = exportToWebVtt(activeSession?.segments || [], activeSession?.title || "");
      ext = "vtt";
      mimeType = "text/vtt";
    } else if (type === "json") {
      content = exportToJson(activeSession?.segments || [], {
        durationSeconds: activeSession?.durationSeconds,
        speakerDiarization: "no disponible",
        mode: activeSession?.mode,
      });
      ext = "json";
      mimeType = "application/json";
    } else if (type === "pdf") {
      // Formatted printable executive summary
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>VozNotAI Executive Report - ${activeSession?.title}</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; }
                h1 { font-size: 24px; color: #001f90; margin-bottom: 4px; }
                .meta { color: #666; font-size: 13px; margin-bottom: 24px; border-bottom: 1px solid #ddd; padding-bottom: 12px; }
                .segment { margin-bottom: 16px; page-break-inside: avoid; }
                .time { font-family: monospace; font-size: 12px; color: #00838f; font-weight: bold; }
                .speaker { font-weight: 600; color: #151b2c; }
                .text { margin-top: 4px; line-height: 1.6; }
                .footer { margin-top: 40px; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
              </style>
            </head>
            <body>
              <h1>VozNotAI — Reporte Ejecutivo de Transcripción</h1>
              <div class="meta">
                <strong>Archivo:</strong> ${activeSession?.title} &bull; 
                <strong>Duración:</strong> ${activeSession?.formattedDuration} &bull; 
                <strong>Costo:</strong> ${formatInferenceCost(activeSession?.durationSeconds || 0, settings.ratePerMinuteUsd, activeSession?.estimatedCostUsd)} &bull; 
                <strong>Fecha:</strong> ${new Date().toLocaleDateString()}
              </div>
              <div>
                ${(activeSession?.segments || [])
                  .map(
                    (s) => `
                  <div class="segment">
                    <span class="time">[${s.start.toFixed(2)}s]</span> 
                    <span class="speaker">${s.speaker}</span>:
                    <div class="text">${s.text}</div>
                  </div>
                `
                  )
                  .join("")}
              </div>
              <div class="footer">
                Documento generado por VozNotAI Enterprise &bull; Infraestructura ClustLayer &bull; Eureka Solutions
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
      }
      return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameBase}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveTitle = () => {
    if (activeSession && titleInput.trim()) {
      updateSession(activeSession.id, { title: titleInput.trim() });
      setIsEditingTitle(false);
      setSaveSuccessMsg("Título guardado");
      setTimeout(() => setSaveSuccessMsg(""), 2000);
    }
  };

  const handleAddNote = () => {
    if (!noteContent.trim() || !activeSession) return;

    addNote({
      sessionId: activeSession.id,
      audioTitle: activeSession.title,
      timestampSeconds: Math.floor(currentTime),
      timestampFormatted: formattedCurrentTime,
      authorName: `${currentUser?.name ?? ""} ${currentUser?.lastName ?? ""}`.trim(),
      authorRole: currentUser?.roleTitle,
      category: noteCategory,
      tags: [noteCategory, activeSession.space.split(" ")[0]],
      content: noteContent.trim(),
    });

    setNoteContent("");
    setSaveSuccessMsg("Nota anclada en " + formattedCurrentTime);
    setTimeout(() => setSaveSuccessMsg(""), 2500);
  };

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(sessionSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (sessionFilter === "fijadas") return s.tags?.some((tag) => tag.toLowerCase() === "fijada");
    return true;
  });

  // Highlight keywords in segment text
  const renderHighlightedText = (text: string) => {
    if (!transcriptSearch.trim()) return text;
    const parts = text.split(new RegExp(`(${transcriptSearch})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === transcriptSearch.toLowerCase() ? (
        <mark key={i} className="bg-[#48d9e8]/30 text-[#48d9e8] px-1 rounded font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex flex-col gap-5 max-w-[1720px] mx-auto w-full pb-16 animate-fadeIn select-none">
      {/* 1. BARRA DE HERRAMIENTAS SUPERIOR DEL WORKSPACE */}
      <header className="bg-[#151b2c] rounded-2xl p-5 shadow-xl flex flex-col gap-4 border border-[#24293b]/70">
        {/* Title, Tags & Quick Status Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 flex-1 min-w-[320px]">
            <div className="w-10 h-10 rounded-xl bg-[#24293b] flex items-center justify-center text-[#48d9e8] shadow-md border border-[#48d9e8]/20 shrink-0">
              <span className="material-symbols-outlined text-[24px]">audio_file</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                {isEditingTitle ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                      className="bg-[#080e1e] text-[#dde2f9] font-['Space_Grotesk'] text-base font-semibold px-2 py-1 rounded-lg border border-[#48d9e8] focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveTitle}
                      className="p-1 rounded bg-[#48d9e8] text-[#00363b]"
                      title="Guardar"
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </button>
                  </div>
                ) : (
                  <h1
                    onClick={() => setIsEditingTitle(true)}
                    className="font-['Space_Grotesk'] text-lg font-semibold text-[#dde2f9] tracking-tight truncate max-w-lg cursor-pointer hover:text-[#48d9e8] transition-colors"
                    title="Clic para editar nombre"
                  >
                    {activeSession?.title}
                  </h1>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(!isEditingTitle)}
                  className="text-[#8f8fa0] hover:text-[#48d9e8] p-1 rounded transition-colors"
                  aria-label="Editar nombre de archivo"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
                {saveSuccessMsg && (
                  <span className="text-xs text-[#48d9e8] font-medium animate-fadeIn">
                    {saveSuccessMsg}
                  </span>
                )}
              </div>

              {/* Metadata Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {(activeSession?.tags ?? []).map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded bg-[#191f30] text-[#c5c5d7] text-xs border border-[#24293b]">
                    {tag}
                  </span>
                ))}
                <form
                  className="flex items-center gap-1"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const tag = tagDraft.trim();
                    if (!tag || !activeSession || activeSession.id.startsWith("pending-")) return;
                    if ((activeSession.tags ?? []).some((item) => item.toLowerCase() === tag.toLowerCase())) {
                      setTagDraft("");
                      return;
                    }
                    void updateSession(activeSession.id, { tags: [...(activeSession.tags ?? []), tag] });
                    setTagDraft("");
                  }}
                >
                  <input
                    value={tagDraft}
                    onChange={(event) => setTagDraft(event.target.value)}
                    placeholder="Nueva etiqueta"
                    className="w-28 bg-[#080e1e] text-[#dde2f9] text-xs px-2 py-0.5 rounded border border-[#24293b] focus:outline-none focus:border-[#48d9e8]"
                  />
                  <button
                    type="submit"
                    className="px-2 py-0.5 rounded bg-[#24293b] text-[#48d9e8] text-xs border border-[#48d9e8]/20"
                  >
                    Añadir
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Engine Processing Switch & Hardware Specs */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Switch Local CUDA vs Cloud */}
            {currentUser.role === "admin" ? (
              <div
                className="bg-[#080e1e] p-1 rounded-xl flex items-center gap-1 border border-[#24293b]/70"
                role="radiogroup"
                aria-label="Motor de Inferencia de Transcripción (Admin)"
              >
                <button
                  type="button"
                  onClick={() => updateSettings({ executionMode: "local" })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    settings.executionMode === "local"
                      ? "bg-[#00b7c6] text-[#001f23] font-semibold shadow-md"
                      : "text-[#c5c5d7] hover:text-[#dde2f9]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">memory</span>
                  <span>Motor del servidor</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ executionMode: "api" })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    settings.executionMode === "api"
                      ? "bg-[#00b7c6] text-[#001f23] font-semibold shadow-md"
                      : "text-[#c5c5d7] hover:text-[#dde2f9]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">cloud</span>
                  <span>Whisper Cloud API</span>
                </button>
              </div>
            ) : (
              <div className="bg-[#080e1e] px-3.5 py-2 rounded-xl flex items-center gap-2 border border-[#24293b]/70 text-xs text-[#dde2f9]">
                <span className="material-symbols-outlined text-[#48d9e8] text-[18px]">graphic_eq</span>
                <span className="font-medium">{processing ? "Transcribiendo…" : "Transcripción"}</span>
              </div>
            )}

            {/* Security Badge with Tooltip */}
            <div className="group relative flex items-center">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#191f30] text-[#48d9e8] text-xs font-medium border border-[#48d9e8]/20 cursor-help">
                <span className="material-symbols-outlined text-[16px]">lock</span>
                <span className="font-['Space_Grotesk']">{currentUser?.role === "admin" ? "Detalle del motor" : "Sesión privada"}</span>
              </div>
              <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-[#2f3446] text-[#dde2f9] text-xs rounded-xl shadow-2xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity border border-[#48d9e8]/30">
                <p className="font-semibold text-[#48d9e8] mb-1">Tu audio</p>
                {currentUser?.role === "admin"
                  ? "El administrador ve el modo configurado en el servidor."
                  : "Solo tu cuenta puede abrir este audio y su texto."}
              </div>
            </div>

            {/* Version Save & Language selector */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={currentUser?.preferredLanguage || "auto"}
                  onChange={(e) => {
                    void updateUser({ preferredLanguage: e.target.value });
                  }}
                  aria-label="Idioma preferido de transcripción"
                  className="appearance-none bg-[#191f30] pl-3 pr-8 py-1.5 rounded-lg text-[#dde2f9] text-xs border border-[#24293b] focus:outline-none focus:ring-1 focus:ring-[#48d9e8] cursor-pointer"
                >
                  <option value="auto">Detección automática</option>
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                  <option value="pt">Portugués</option>
                  <option value="fr">Francés</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-base text-[#8f8fa0]">
                  expand_more
                </span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setExportOpen((open) => !open)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#bac3ff] text-[#001f90] text-xs font-semibold flex items-center gap-1.5 shadow-md hover:bg-[#dee0ff] transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Exportar</span>
                </button>
                {exportOpen && (
                  <div className="absolute right-0 mt-2 w-36 rounded-xl bg-[#151b2c] border border-[#24293b] shadow-xl z-30 p-1">
                    {(["txt", "srt", "vtt", "json", "pdf"] as const).map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => {
                          handleExport(format);
                          setExportOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#dde2f9] hover:bg-[#24293b] uppercase"
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Audio Telemetry Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[#c5c5d7] font-['Space_Grotesk'] text-xs bg-[#080e1e]/60 p-3 rounded-xl border border-[#24293b]/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#48d9e8] text-[16px]">timelapse</span>
            <span>
              Duración: <strong className="text-[#dde2f9]">{activeSession?.formattedDuration || "00:00"}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#48d9e8] text-[16px]">graphic_eq</span>
            <span>
              Formato: <strong className="text-[#dde2f9]">{activeSession?.format || "AUDIO"}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#48d9e8] text-[16px]">folder_zip</span>
            <span>
              Tamaño: <strong className="text-[#dde2f9]">{activeSession?.fileSizeBytes ? formatFileSize(activeSession.fileSizeBytes) : "Sin tamaño"}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#48d9e8] text-[16px]">account_tree</span>
            <span>
              Estado: <strong className="text-[#dde2f9]">{activeSession?.status || "Sin audio"}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#48d9e8] text-[16px]">receipt_long</span>
            <span>
              Costo: <strong className="text-[#48d9e8]">{activeSession?.status === "Procesando" ? "Calculando…" : formatInferenceCost(activeSession?.durationSeconds || 0, settings.ratePerMinuteUsd, activeSession?.estimatedCostUsd)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 justify-end">
            {currentUser.role === "admin" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#48d9e8] animate-ping"></span>
                <span className="text-[#dde2f9]">VRAM: {activeSession?.vramUsedGb || 6.8} / 24 GB</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-[#dde2f9]">{processing ? "Generando texto" : "Listo"}</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. REPRODUCTOR DE AUDIO ACÚSTICO AVANZADO (PLAYER) */}
      <section
        aria-label="Reproductor Acústico de Alta Fidelidad"
        className="bg-[#151b2c] rounded-2xl p-5 shadow-xl flex flex-col gap-3 relative overflow-hidden border border-[#24293b]/70"
      >
        {/* Glow ambient backdrop line */}
        <div className="absolute -top-12 left-1/4 w-96 h-24 bg-[#48d9e8]/10 blur-3xl pointer-events-none"></div>

        {/* Interactive Waveform Area */}
        <div
          id="waveform-container"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
            seekTo(ratio * duration);
          }}
          className="relative w-full h-24 bg-[#080e1e] rounded-xl p-3 flex flex-col justify-between overflow-hidden cursor-pointer select-none group border border-[#24293b]/60"
          role="slider"
          aria-label="Línea de tiempo de audio"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          tabIndex={0}
        >
          {/* Chapter markers overhead */}
          <div className="flex justify-between items-center px-1 text-[#8f8fa0] font-['Space_Grotesk'] text-[11px] z-10">
            <span className="text-[#48d9e8]" onClick={(e) => { e.stopPropagation(); seekTo(0); }}>
              00:00
            </span>
            <span>{activeSession?.formattedDuration || "00:00"}</span>
          </div>

          {/* Rendered Interactive Dynamic Audio Waves */}
          <div className="w-full h-12 flex items-center justify-between gap-[2px] relative z-10 px-1">
            {/* 60 wave bars calculated against progress */}
            {Array.from({ length: 64 }).map((_, i) => {
              const barProgress = i / 64;
              const currentProgress = duration > 0 ? currentTime / duration : 0;
              const isPlayed = barProgress <= currentProgress;
              // deterministic aesthetic heights
              const baseHeight = [
                35, 50, 75, 90, 60, 40, 65, 80, 95, 70, 55, 85, 100, 78, 45, 30,
                65, 88, 92, 60, 40, 70, 85, 50, 90, 65, 40, 75, 95, 60, 35, 55,
                75, 90, 45, 70, 85, 60, 40, 75, 95, 65, 35, 50, 80, 60, 40, 85,
                100, 70, 45, 30, 60, 90, 75, 50, 30, 65, 80, 50, 25, 40, 60, 80
              ][i % 64];

              return (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-colors duration-150 ${
                    isPlayed ? "bg-[#48d9e8]" : "bg-[#444654]/60"
                  }`}
                  style={{ height: `${baseHeight}%` }}
                ></span>
              );
            })}

            {/* Active Scrubber Head Overlay */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none flex flex-col items-center z-20"
              style={{
                left: `${Math.max(0, Math.min(100, (currentTime / (duration || 1)) * 100))}%`,
              }}
            >
              <div className="px-1.5 py-0.5 rounded bg-[#48d9e8] text-[#00363b] font-['Space_Grotesk'] text-[10px] font-bold shadow-md -translate-x-1/2 -mt-1">
                {formattedCurrentTime}
              </div>
              <div className="w-0.5 h-full bg-[#bac3ff] shadow-[0_0_12px_#48d9e8] -translate-x-1/2"></div>
            </div>
          </div>

          {/* Progress Track Baseline */}
          <div className="w-full bg-[#24293b] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#48d9e8] to-[#7287ff] h-full transition-all duration-100"
              style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Playback Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Timestamp Indicators & Skip Buttons */}
          <div className="flex items-center gap-3">
            <span className="font-['Space_Grotesk'] text-xl text-[#48d9e8] font-bold">
              {formattedCurrentTime}
            </span>
            <span className="font-['Space_Grotesk'] text-xs text-[#8f8fa0]">/ {formattedDuration}</span>

            <div className="flex items-center gap-1 ml-2">
              <button
                type="button"
                onClick={() => skipSeconds(-5)}
                className="p-2 rounded-lg bg-[#191f30] hover:bg-[#24293b] text-[#dde2f9] hover:text-[#48d9e8] transition-colors"
                title="Rebobinar 5s (Shift+←)"
                aria-label="Rebobinar 5 segundos"
              >
                <span className="material-symbols-outlined text-[20px]">replay_5</span>
              </button>

              {/* Master Play / Pause Button */}
              <button
                type="button"
                onClick={togglePlay}
                className="w-11 h-11 rounded-full bg-gradient-to-r from-[#48d9e8] to-[#7287ff] text-[#00105b] flex items-center justify-center shadow-[0_0_16px_rgba(72,217,232,0.4)] hover:brightness-110 active:scale-95 transition-transform"
                title="Reproducir / Pausar (Espacio)"
                aria-label={isPlaying ? "Pausar audio" : "Reproducir audio"}
              >
                <span className="material-symbols-outlined text-[26px]">
                  {isPlaying ? "pause" : "play_arrow"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => skipSeconds(5)}
                className="p-2 rounded-lg bg-[#191f30] hover:bg-[#24293b] text-[#dde2f9] hover:text-[#48d9e8] transition-colors"
                title="Adelantar 5s (Shift+→)"
                aria-label="Adelantar 5 segundos"
              >
                <span className="material-symbols-outlined text-[20px]">forward_5</span>
              </button>
            </div>

            {/* Speed Stepper */}
            <div
              className="flex items-center bg-[#191f30] rounded-lg p-0.5 ml-2 border border-[#24293b]"
              role="group"
              aria-label="Velocidad de reproducción"
            >
              {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setPlaybackRate(rate)}
                  className={`px-2 py-1 rounded text-xs font-['Space_Grotesk'] transition-all ${
                    playbackRate === rate
                      ? "bg-[#24293b] text-[#48d9e8] font-semibold shadow-sm"
                      : "text-[#c5c5d7] hover:text-[#dde2f9]"
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Volume & Fast Note Attachment Button */}
          <div className="flex items-center gap-4">
            {/* Volume Slider */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVolume(volume > 0 ? 0 : 0.85)}
                className="text-[#c5c5d7] hover:text-[#48d9e8] transition-colors"
                aria-label={volume === 0 ? "Reactivar sonido" : "Silenciar"}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {volume === 0 ? "volume_off" : volume < 0.5 ? "volume_down" : "volume_up"}
                </span>
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 sm:w-28 h-1.5 bg-[#2f3446] rounded-lg appearance-none cursor-pointer accent-[#48d9e8]"
                aria-label="Control de volumen"
              />
            </div>

            {/* Quick Note Creation Button */}
            <button
              type="button"
              onClick={() => {
                const noteInput = document.getElementById("workspace-note-input");
                noteInput?.focus();
              }}
              className="px-3.5 py-2 rounded-xl bg-[#9b7fed]/20 text-[#cebdff] hover:bg-[#9b7fed]/30 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 border border-[#cebdff]/30 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
              <span>Anotar en {formattedCurrentTime}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. VISTA DIVIDIDA (SPLIT-PANE) DE ALTA PRODUCTIVIDAD (3 COLUMNAS: 3 / 6 / 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* PANEL IZQUIERDO: HISTORIAL DE SESIONES Y CONVERSACIONES (3 COLS) */}
        <section
          aria-label="Historial de Sesiones de Audio"
          className="lg:col-span-3 bg-[#151b2c] rounded-2xl p-4 flex flex-col gap-3 shadow-lg border border-[#24293b]/70 h-[750px]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#48d9e8] text-[20px]">folder_managed</span>
              <h2 className="font-['Space_Grotesk'] text-base font-semibold text-[#dde2f9]">Sesiones</h2>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#191f30] text-[#c5c5d7] font-['Space_Grotesk'] text-xs border border-[#24293b]">
              {sessions.length} audios
            </span>
          </div>

          {/* Search Bar with Shortcut */}
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8f8fa0] text-[18px]">
              search
            </span>
            <input
              id="session-search-input"
              type="text"
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              placeholder="Buscar sesión (Ctrl+K)..."
              className="w-full bg-[#080e1e] pl-9 pr-12 py-2 rounded-lg text-[#dde2f9] text-xs focus:outline-none focus:ring-1 focus:ring-[#48d9e8] border border-[#24293b]/60 placeholder:text-[#8f8fa0]/60"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-[#2f3446] text-[#c5c5d7] font-['Space_Grotesk'] text-[10px]">
              ⌘K
            </kbd>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1 text-xs text-[#c5c5d7] border-b border-[#24293b]/60 pb-2">
            <button
              type="button"
              onClick={() => setSessionFilter("hoy")}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                sessionFilter === "hoy"
                  ? "bg-[#24293b] text-[#48d9e8] font-semibold"
                  : "hover:bg-[#191f30] hover:text-[#dde2f9]"
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setSessionFilter("semana")}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                sessionFilter === "semana"
                  ? "bg-[#24293b] text-[#48d9e8] font-semibold"
                  : "hover:bg-[#191f30] hover:text-[#dde2f9]"
              }`}
            >
              Esta semana
            </button>
            <button
              type="button"
              onClick={() => setSessionFilter("fijadas")}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1 ${
                sessionFilter === "fijadas"
                  ? "bg-[#24293b] text-[#48d9e8] font-semibold"
                  : "hover:bg-[#191f30] hover:text-[#dde2f9]"
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">push_pin</span>
              Fijadas
            </button>
          </div>

          {/* Session List (Scrollable) */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
            {filteredSessions.map((sess) => {
              const isActive = sess.id === activeSession?.id;
              return (
                <article
                  key={sess.id}
                  onClick={() => selectSession(sess.id)}
                  className={`p-3 rounded-xl transition-all cursor-pointer border ${
                    isActive
                      ? "bg-[#24293b] text-[#dde2f9] border-[#48d9e8]/50 shadow-md"
                      : "bg-[#191f30]/60 hover:bg-[#191f30] text-[#dde2f9] border-[#24293b]/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isActive ? "text-[#48d9e8]" : "text-[#dde2f9]"
                      }`}
                    >
                      {sess.title}
                    </span>
                    {isActive ? (
                      <span className="px-1.5 py-0.5 rounded bg-[#48d9e8]/15 text-[#48d9e8] font-['Space_Grotesk'] text-[10px] shrink-0 font-bold">
                        Activo
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-[#080e1e] text-[#8f8fa0] font-['Space_Grotesk'] text-[10px] shrink-0">
                        {sess.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[#8f8fa0] text-[11px] mt-1">
                    <span>{sess.createdAt}</span>
                    <span className="font-['Space_Grotesk']">{sess.formattedDuration}</span>
                  </div>

                  {sess.status === "Procesando" ? (
                    <div className="w-full bg-[#2f3446] h-1 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-[#cebdff] h-full"
                        style={{ width: `${sess.progressPercentage || 64}%` }}
                      ></div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[#8f8fa0] text-[11px] mt-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          sess.status === "Completado" ? "bg-[#48d9e8]" : "bg-[#8f8fa0]"
                        }`}
                      ></span>
                      <span>
                        {sess.notesCount > 0 ? `${sess.notesCount} notas generadas` : "Listo para transcribir"}
                      </span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Import New Local Audio Button */}
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-[#191f30] hover:bg-[#24293b] text-[#48d9e8] text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-[#48d9e8]/20"
          >
            <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
            <span>Subir audio</span>
          </button>
        </section>

        {/* PANEL CENTRAL: TRANSCRIPCIÓN SEGMENTADA & BÚSQUEDA IA (6 COLS) */}
        <section
          aria-label="Transcripción Inteligente Segmentada"
          className="lg:col-span-6 bg-[#151b2c] rounded-2xl p-4 flex flex-col gap-3 shadow-lg border border-[#24293b]/70 h-[750px]"
        >
          {/* Transcript Header with in-text Keyword Search */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#24293b]/60">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#48d9e8] text-[24px]">subject</span>
              <div>
                <h2 className="font-['Space_Grotesk'] text-base font-semibold text-[#dde2f9]">
                  Transcripción Sincronizada
                </h2>
                <span className="text-[11px] text-[#c5c5d7]">
                  {activeSession?.status === "Procesando"
                    ? "Generando transcripción"
                    : `${activeSession?.segments?.length ?? 0} segmentos`}
                </span>
              </div>
            </div>

            {/* Keyword Search & Match Counter */}
            <div className="flex items-center gap-1 bg-[#080e1e] p-1 rounded-xl border border-[#24293b]/70">
              <span className="material-symbols-outlined text-[#8f8fa0] text-[16px] ml-1.5">
                search
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={transcriptSearch}
                onChange={(e) => {
                  setTranscriptSearch(e.target.value);
                  setSearchMatchIndex(0);
                }}
                placeholder="Buscar palabras..."
                className="bg-transparent px-1.5 py-0.5 text-xs text-[#dde2f9] focus:outline-none w-28 sm:w-36"
              />
              <span className="px-1.5 py-0.5 rounded bg-[#24293b] text-[#48d9e8] font-['Space_Grotesk'] text-[10px] whitespace-nowrap">
                {searchResults.totalMatches > 0
                  ? `${Math.min(searchMatchIndex + 1, searchResults.totalMatches)} de ${searchResults.totalMatches}`
                  : "0 de 0"}
              </span>
              <button
                type="button"
                onClick={() =>
                  setSearchMatchIndex((prev) =>
                    prev > 0 ? prev - 1 : Math.max(0, searchResults.totalMatches - 1)
                  )
                }
                className="p-1 rounded text-[#8f8fa0] hover:text-[#dde2f9] hover:bg-[#191f30]"
                title="Coincidencia anterior"
              >
                <span className="material-symbols-outlined text-[16px]">keyboard_arrow_up</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setSearchMatchIndex((prev) =>
                    prev < searchResults.totalMatches - 1 ? prev + 1 : 0
                  )
                }
                className="p-1 rounded text-[#8f8fa0] hover:text-[#dde2f9] hover:bg-[#191f30]"
                title="Coincidencia siguiente"
              >
                <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
              </button>
            </div>
          </div>

          {/* Scrollable Segment Stream */}
          <div ref={transcriptFeedRef} className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
            {activeSession?.segments && activeSession.segments.length > 0 ? (
              activeSession.segments.map((seg) => {
                const isCurrent = currentTime >= seg.start && currentTime <= seg.end;
                return (
                  <article
                    key={seg.id}
                    className={`p-3 rounded-xl flex flex-col gap-1.5 transition-all border ${
                      isCurrent
                        ? "bg-[#48d9e8]/10 border-[#48d9e8] shadow-[inset_3px_0_0_#48d9e8]"
                        : "bg-[#080e1e]/80 border-[#24293b]/40 hover:bg-[#191f30]/80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => seekTo(seg.start)}
                          className={`px-2 py-0.5 rounded font-['Space_Grotesk'] text-[11px] transition-colors ${
                            isCurrent
                              ? "bg-[#48d9e8] text-[#00363b] font-bold shadow"
                              : "bg-[#24293b] hover:bg-[#48d9e8]/20 hover:text-[#48d9e8] text-[#c5c5d7]"
                          }`}
                          title="Saltar audio a este timestamp"
                        >
                          {new Date(seg.start * 1000).toISOString().substr(11, 8)}
                        </button>
                        <span className="text-xs font-semibold text-[#48d9e8] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">record_voice_over</span>
                          {seg.speaker}
                        </span>
                        {seg.speakerRole && (
                          <span className="px-2 py-0.2 rounded-full bg-[#48d9e8]/10 text-[#48d9e8] text-[10px]">
                            {seg.speakerRole}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded bg-[#48d9e8]/20 text-[#48d9e8] font-['Space_Grotesk'] text-[10px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#48d9e8] animate-ping"></span>
                            Reproduciendo
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(seg.text);
                            setSaveSuccessMsg("Segmento copiado");
                            setTimeout(() => setSaveSuccessMsg(""), 2000);
                          }}
                          className="p-1 text-[#8f8fa0] hover:text-[#dde2f9] hover:bg-[#191f30] rounded"
                          title="Copiar segmento"
                        >
                          <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            seekTo(seg.start);
                            setNoteContent(seg.text);
                            const noteInput = document.getElementById("workspace-note-input");
                            noteInput?.focus();
                          }}
                          className="p-1 text-[#8f8fa0] hover:text-[#cebdff] hover:bg-[#191f30] rounded"
                          title="Vincular nota a este segmento"
                        >
                          <span className="material-symbols-outlined text-[14px]">bookmark_add</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[#dde2f9] leading-relaxed pl-1 font-normal">
                      {renderHighlightedText(seg.text)}
                    </p>
                  </article>
                );
              })
            ) : (
              <div className="p-8 text-center text-[#8f8fa0] text-xs">
                No hay segmentos disponibles para esta sesión.
              </div>
            )}
          </div>
        </section>

        {/* PANEL DERECHO: NOTAS INTELIGENTES VINCULADAS AL TIMESTAMPS (3 COLS) */}
        <section
          aria-label="Módulo de Notas Inteligentes Vinculadas"
          className="lg:col-span-3 bg-[#151b2c] rounded-2xl p-4 flex flex-col gap-3 shadow-lg border border-[#24293b]/70 h-[750px]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#cebdff] text-[20px]">auto_awesome</span>
              <h2 className="font-['Space_Grotesk'] text-base font-semibold text-[#dde2f9]">
                Notas y Hallazgos
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#9b7fed]/20 text-[#cebdff] font-['Space_Grotesk'] text-xs border border-[#cebdff]/30 font-semibold">
              {notes.length} Anotaciones
            </span>
          </div>

          {/* Quick Note Creator Input (Markdown Supported) */}
          <div className="bg-[#080e1e] p-3 rounded-xl flex flex-col gap-2 border border-[#24293b]/60 shadow-inner">
            <div className="flex items-center justify-between text-xs text-[#c5c5d7]">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#48d9e8]">pin_drop</span>
                <span>Anclar nota en:</span>
                <strong className="font-['Space_Grotesk'] text-[#48d9e8]">{formattedCurrentTime}</strong>
              </span>
              <span className="font-['Space_Grotesk'] text-[10px] text-[#8f8fa0]">Markdown</span>
            </div>

            <textarea
              id="workspace-note-input"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Escribe un punto clave o conclusión..."
              rows={3}
              className="w-full bg-[#191f30] p-2.5 rounded-lg text-xs text-[#dde2f9] placeholder:text-[#8f8fa0]/60 focus:outline-none focus:ring-1 focus:ring-[#cebdff] resize-none border border-[#24293b]"
            ></textarea>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[#8f8fa0]">
                <button
                  type="button"
                  onClick={() => setNoteContent((c) => `${c} **texto en negrita**`)}
                  className="px-1.5 py-0.5 rounded hover:bg-[#24293b] text-xs font-bold"
                  title="Negrita"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => setNoteContent((c) => `${c} *texto en cursiva*`)}
                  className="px-1.5 py-0.5 rounded hover:bg-[#24293b] text-xs italic"
                  title="Cursiva"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => setNoteContent((c) => `${c}\n- Punto de viñeta`)}
                  className="p-1 rounded hover:bg-[#24293b]"
                  title="Lista"
                >
                  <span className="material-symbols-outlined text-[14px]">format_list_bulleted</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddNote}
                disabled={!noteContent.trim()}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  noteContent.trim()
                    ? "bg-[#cebdff] text-[#381385] hover:brightness-110 active:scale-95 shadow"
                    : "bg-[#24293b] text-[#8f8fa0] cursor-not-allowed"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">add_task</span>
                <span>Guardar</span>
              </button>
            </div>
          </div>

          {/* List of Linked Notes with scrubber triggers */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 pt-1">
            {notes.map((n) => {
              const isPinnedCurrent = Math.abs(currentTime - n.timestampSeconds) < 60;
              return (
                <article
                  key={n.id}
                  className={`p-3 rounded-xl flex flex-col gap-1.5 transition-all border ${
                    isPinnedCurrent
                      ? "bg-[#9b7fed]/15 border-[#cebdff]/40 shadow-sm"
                      : "bg-[#191f30] hover:bg-[#24293b] border-[#24293b]/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => seekTo(n.timestampSeconds)}
                      className="px-2 py-0.5 rounded bg-[#24293b] hover:bg-[#48d9e8]/20 hover:text-[#48d9e8] text-[#48d9e8] font-['Space_Grotesk'] text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      title="Saltar audio a este timestamp"
                    >
                      <span className="material-symbols-outlined text-[13px]">play_arrow</span>
                      <span>00:{n.timestampFormatted}</span>
                    </button>
                    <span className="text-[11px] text-[#c5c5d7]">{n.authorName}</span>
                  </div>

                  <p className="text-xs text-[#dde2f9] leading-relaxed">{n.content}</p>

                  <div className="flex items-center justify-between text-[#8f8fa0] text-[10px] mt-0.5">
                    <div className="flex items-center gap-1">
                      {n.tags.map((t, i) => (
                        <span key={i} className="px-1.5 py-0.2 rounded bg-[#080e1e] text-[#cebdff]">
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="font-['Space_Grotesk'] text-[#8f8fa0]">{n.createdAt}</span>
                  </div>
                </article>
              );
            })}

            {notes.length === 0 && (
              <p className="text-xs text-[#8f8fa0] px-1">Esta conversación todavía no tiene notas.</p>
            )}
          </div>
        </section>
      </div>

      {/* 4. ACCIONES DE EXPORTACIÓN Y ACCESIBILIDAD WCAG 2.2 AA */}
      <footer className="bg-[#151b2c] rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#24293b]/70">
        {/* Multi-format Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#c5c5d7] mr-1 font-medium">Exportar transcripción:</span>
          <button
            type="button"
            onClick={() => handleExport("txt")}
            className="px-3 py-1.5 rounded-lg bg-[#191f30] hover:bg-[#24293b] text-[#dde2f9] hover:text-[#48d9e8] font-['Space_Grotesk'] text-xs flex items-center gap-1.5 transition-colors border border-[#24293b]"
          >
            <span className="material-symbols-outlined text-[16px]">description</span>
            <span>TXT</span>
          </button>
          <button
            type="button"
            onClick={() => handleExport("srt")}
            className="px-3 py-1.5 rounded-lg bg-[#191f30] hover:bg-[#24293b] text-[#dde2f9] hover:text-[#48d9e8] font-['Space_Grotesk'] text-xs flex items-center gap-1.5 transition-colors border border-[#24293b]"
          >
            <span className="material-symbols-outlined text-[16px]">subtitles</span>
            <span>SRT</span>
          </button>
          <button
            type="button"
            onClick={() => handleExport("vtt")}
            className="px-3 py-1.5 rounded-lg bg-[#191f30] hover:bg-[#24293b] text-[#dde2f9] hover:text-[#48d9e8] font-['Space_Grotesk'] text-xs flex items-center gap-1.5 transition-colors border border-[#24293b]"
          >
            <span className="material-symbols-outlined text-[16px]">closed_caption</span>
            <span>VTT</span>
          </button>
          <button
            type="button"
            onClick={() => handleExport("json")}
            className="px-3 py-1.5 rounded-lg bg-[#191f30] hover:bg-[#24293b] text-[#dde2f9] hover:text-[#48d9e8] font-['Space_Grotesk'] text-xs flex items-center gap-1.5 transition-colors border border-[#24293b]"
          >
            <span className="material-symbols-outlined text-[16px]">data_object</span>
            <span>JSON</span>
          </button>
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            className="px-3.5 py-1.5 rounded-lg bg-[#7287ff] text-[#00105b] font-['Space_Grotesk'] text-xs font-bold flex items-center gap-1.5 shadow hover:bg-[#bac3ff] transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            <span>PDF Ejecutivo</span>
          </button>
        </div>

        {/* Visible Keyboard Shortcuts for Accessibility WCAG */}
        <div className="flex items-center gap-4 text-[#8f8fa0] font-['Space_Grotesk'] text-[11px]">
          <span className="hidden md:inline-flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[#24293b] text-[#dde2f9]">Espacio</kbd> Play / Pause
          </span>
          <span className="hidden md:inline-flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[#24293b] text-[#dde2f9]">Shift + ← / →</kbd> ±5s
          </span>
          <span className="hidden lg:inline-flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[#24293b] text-[#dde2f9]">Ctrl + N</kbd> Nueva Nota
          </span>
        </div>
      </footer>

      {/* Discrete Infrastructure Attribution Banner */}
      <div className="flex items-center justify-between px-1 text-[#8f8fa0]/70 text-xs pb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#48d9e8]"></span>
          <span>VozNotAI • ClustLayer / Eureka • Andrey Quiceno</span>
        </div>
        <div className="flex items-center gap-2 font-['Space_Grotesk'] text-[11px]">
          <span>Model: whisper-large-v3-fp16</span>
          <span>•</span>
          <span>Cluster: Eureka-Prod-01</span>
        </div>
      </div>

      {/* Upload Modal */}
      <QuickUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={(sess) => {
          selectSession(sess.id);
        }}
      />
    </div>
  );
};
