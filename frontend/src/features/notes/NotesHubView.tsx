import React, { useState } from "react";
import { useVozNotStore } from "../../services/store.ts";
import { formatDuration } from "../../utils/costCalculator.ts";
import type { SmartNote } from "../../types/index.ts";

interface NotesHubViewProps {
  onNavigateToSession?: (sessionId: string) => void;
}

export const NotesHubView: React.FC<NotesHubViewProps> = ({ onNavigateToSession }) => {
  const { notes, sessions, addNote, deleteNote, currentUser } = useVozNotStore();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeNote, setActiveNote] = useState<SmartNote | null>(notes[0] || null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Note state
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<SmartNote["category"]>("Acción Pendiente");
  const [newSessionId, setNewSessionId] = useState<string>(sessions[0]?.id || "sess-01");
  const [newTimestamp, setNewTimestamp] = useState<number>(0);
  const [newTags, setNewTags] = useState<string>("Estrategia, ClustLayer");

  const filteredNotes = notes.filter((n) => {
    const titleMatch = (n.audioTitle || "").toLowerCase().includes(search.toLowerCase());
    const contentMatch = (n.content || "").toLowerCase().includes(search.toLowerCase());
    const categoryMatch = selectedCategory === "all" || n.category === selectedCategory;
    const authorMatch = (n.authorName || "").toLowerCase().includes(search.toLowerCase());
    return (titleMatch || contentMatch || authorMatch) && categoryMatch;
  });

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const matchedSession = sessions.find((s) => s.id === newSessionId);
    const audioTitle = matchedSession ? matchedSession.title : "Audio Desconocido";
    const tagsArray = newTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    addNote({
      sessionId: newSessionId,
      audioTitle,
      timestampSeconds: newTimestamp,
      timestampFormatted: formatDuration(newTimestamp),
      authorName: currentUser?.name || "Operador Forense",
      authorRole: currentUser?.roleTitle || "Auditor",
      category: newCategory,
      tags: tagsArray,
      content: newContent,
    });

    setShowCreateModal(false);
    setNewContent("");
  };

  const handleExportAllMarkdown = () => {
    const md = notes
      .map(
        (n) =>
          `# ${n.audioTitle} [${n.timestampFormatted}]\n**Categoría:** ${n.category} | **Autor:** ${n.authorName} (${n.authorRole || "Operador"}) | **Fecha:** ${n.createdAt}\n**Etiquetas:** ${n.tags?.join(", ") || "N/A"}\n\n${n.content}\n\n---\n`
      )
      .join("\n");

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notas_inteligentes_voznotai_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#11192e] to-[#121c33] border border-cyan-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1">
            <span className="material-symbols-outlined text-sm">auto_stories</span>
            Centro de Inteligencia Semántica
          </div>
          <h1 className="text-2xl font-display font-bold text-white">
            Notas Inteligentes y Acuerdos de Voz
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-xl">
            Sintetiza decisiones críticas, tareas asignadas y hallazgos fonéticos vinculados a
            marcas de tiempo exactas dentro de las transcripciones de Whisper.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportAllMarkdown}
            className="px-4 py-2 rounded-xl bg-[#18233e] hover:bg-[#202e52] border border-gray-700 text-xs font-medium text-gray-200 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-sm text-cyan-400">download</span>
            Descargar Markdown (.md)
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-500/20"
          >
            <span className="material-symbols-outlined text-sm font-bold">add</span>
            Nueva Nota
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Notes List & Note Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Column: List & Filters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl bg-[#0f172a] border border-gray-800 space-y-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar por contenido, audio o autor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#18233e] border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { id: "all", label: "Todas" },
                { id: "Acción Pendiente", label: "Acciones" },
                { id: "Resumen Ejecutivo", label: "Resúmenes" },
                { id: "Decisión Crítica", label: "Decisiones" },
                { id: "Idea Clave", label: "Ideas" },
                { id: "Infraestructura", label: "Infraestructura" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-cyan-500 text-slate-950 font-semibold"
                      : "bg-[#18233e] text-gray-400 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Card Stream */}
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {filteredNotes.map((note) => {
              const isSelected = activeNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => setActiveNote(note)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? "bg-[#152038] border-cyan-500/60 shadow-lg shadow-cyan-950/40"
                      : "bg-[#0f172a]/80 border-gray-800/80 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white text-xs line-clamp-1">
                      {note.audioTitle}
                    </h3>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase shrink-0 ${
                        note.category === "Acción Pendiente"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : note.category === "Decisión Crítica"
                          ? "bg-red-500/10 text-red-400 border-red-500/30"
                          : note.category === "Resumen Ejecutivo"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                          : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                      }`}
                    >
                      {note.category}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                    {note.content}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono pt-1">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <span className="material-symbols-outlined text-[13px]">timer</span>
                      {note.timestampFormatted || "00:00"}
                    </span>
                    <span>{note.authorName}</span>
                  </div>
                </div>
              );
            })}

            {filteredNotes.length === 0 && (
              <div className="p-8 rounded-xl bg-[#0f172a] border border-gray-800 text-center text-xs text-gray-500 space-y-2">
                <span className="material-symbols-outlined text-2xl text-gray-600">search_off</span>
                <p>No se encontraron notas con el criterio actual.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Note Detail / Reader (7 cols) */}
        <div className="lg:col-span-7">
          {activeNote ? (
            <div className="p-6 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-6 h-full flex flex-col justify-between">
              <div className="space-y-5">
                {/* Header of Note */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono border bg-cyan-500/10 text-cyan-400 border-cyan-500/30 uppercase">
                      {activeNote.category}
                    </span>
                    <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-cyan-400">
                        schedule
                      </span>
                      {activeNote.timestampFormatted || "00:00"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeNote.sessionId && onNavigateToSession && (
                      <button
                        onClick={() => onNavigateToSession(activeNote.sessionId)}
                        className="px-3 py-1.5 rounded-lg bg-[#18233e] hover:bg-[#202e52] text-cyan-400 text-xs font-medium border border-cyan-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Abrir transcripción asociada"
                      >
                        <span className="material-symbols-outlined text-sm">graphic_eq</span>
                        Ir a Transcripción
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm("¿Eliminar esta nota inteligente?")) {
                          deleteNote(activeNote.id);
                          setActiveNote(notes.filter((n) => n.id !== activeNote.id)[0] || null);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Eliminar nota"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>

                {/* Content section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight">
                        {activeNote.audioTitle}
                      </h2>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Registrado por{" "}
                        <strong className="text-gray-200">{activeNote.authorName}</strong> (
                        {activeNote.authorRole || "Operador"})
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-gray-500">{activeNote.createdAt}</span>
                  </div>

                  <div className="p-5 rounded-xl bg-[#111827]/60 border border-gray-800/80 text-sm text-gray-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {activeNote.content}
                  </div>

                  {activeNote.tags && activeNote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {activeNote.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-[#18233e] text-cyan-300 border border-cyan-500/20"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Note Footer */}
              <div className="border-t border-gray-800/80 pt-4 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                <span>ID: {activeNote.id}</span>
                <span>Clúster: Eureka-01 • ClustLayer</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 rounded-2xl bg-[#0f172a] border border-gray-800 text-center text-gray-500 space-y-3">
              <span className="material-symbols-outlined text-4xl text-gray-600">note_alt</span>
              <p className="text-sm">Selecciona una nota para ver los detalles y acuerdos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nueva Nota */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <form
            onSubmit={handleCreateNote}
            className="w-full max-w-md rounded-2xl bg-[#0f172a] border border-gray-800 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Crear Nueva Nota Inteligente</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-gray-400 block mb-1">Categoría:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#18233e] border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="Acción Pendiente">Acción Pendiente</option>
                  <option value="Resumen Ejecutivo">Resumen Ejecutivo</option>
                  <option value="Decisión Crítica">Decisión Crítica</option>
                  <option value="Idea Clave">Idea Clave</option>
                  <option value="Infraestructura">Infraestructura</option>
                  <option value="Hallazgo Clínico">Hallazgo Clínico</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-gray-400 block mb-1">Marca Segundos:</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={newTimestamp}
                  onChange={(e) => setNewTimestamp(Number(e.target.value))}
                  className="w-full bg-[#18233e] border border-gray-700 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1">
                Audio Vinculado:
              </label>
              <select
                value={newSessionId}
                onChange={(e) => setNewSessionId(e.target.value)}
                className="w-full bg-[#18233e] border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1">Etiquetas (separadas por coma):</label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Estrategia, GPU, Auditoría"
                className="w-full bg-[#18233e] border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1">Contenido:</label>
              <textarea
                required
                rows={5}
                placeholder="Escribe el extracto clave, decisión o tarea acordada..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full bg-[#18233e] border border-gray-700 rounded-lg p-3 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs"
              >
                Crear Nota
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
