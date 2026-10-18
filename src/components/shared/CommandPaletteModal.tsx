import React, { useState, useEffect, useRef } from "react";
import { useVozNotStore } from "../../services/store.ts";
import type { AppRoute } from "../../utils/routes.ts";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
  onSelectSession?: (sessionId: string) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectSession,
}) => {
  const { sessions, notes, currentUser, setCurrentSessionId } = useVozNotStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter navigation targets
  const navOptions = [
    { route: "dashboard" as AppRoute, label: "Ir al Dashboard Principal", icon: "grid_view", adminOnly: false },
    { route: "workspace" as AppRoute, label: "Abrir Espacio de Trabajo Acústico", icon: "graphic_eq", adminOnly: false },
    { route: "notes" as AppRoute, label: "Consultar Notas Inteligentes", icon: "auto_awesome", adminOnly: false },
    { route: "manual" as AppRoute, label: "Ver Manual de Operador Forense", icon: "menu_book", adminOnly: false },
    { route: "profile" as AppRoute, label: "Ver Mi Perfil & Consumo de Cuota", icon: "badge", adminOnly: false },
    { route: "ai-config" as AppRoute, label: "Configuración de IA & Whisper", icon: "neurology", adminOnly: false },
    { route: "admin" as AppRoute, label: "Panel Administrador del Clúster CUDA", icon: "admin_panel_settings", adminOnly: true },
  ].filter((item) => {
    if (item.adminOnly && currentUser?.role !== "admin") return false;
    return item.label.toLowerCase().includes(query.toLowerCase());
  });

  // Filter audio sessions
  const filteredSessions = sessions
    .filter(
      (s) =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.space.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 4);

  // Filter notes
  const filteredNotes = notes
    .filter(
      (n) =>
        n.content.toLowerCase().includes(query.toLowerCase()) ||
        n.audioTitle.toLowerCase().includes(query.toLowerCase()) ||
        n.category.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 4);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0f172a] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-800 bg-[#131b2e]">
          <span className="material-symbols-outlined text-cyan-400 mr-3 text-xl">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar sesiones, notas, interlocutores o comandos (o presiona Esc para cerrar)..."
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-gray-800 text-[11px] font-mono text-gray-400">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Navigation Commands */}
          {navOptions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-gray-400">
                Navegación & Comandos
              </div>
              <div className="space-y-1">
                {navOptions.map((opt) => (
                  <button
                    key={opt.route}
                    onClick={() => {
                      onNavigate(opt.route);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#1a243d] text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-sm text-gray-400 group-hover:text-cyan-400">
                        {opt.icon}
                      </span>
                      <span className="text-xs text-gray-200 group-hover:text-white font-medium">
                        {opt.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase">Ir a vista</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Audio Sessions */}
          {filteredSessions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-gray-400">
                Audios & Transcripciones
              </div>
              <div className="space-y-1">
                {filteredSessions.map((sess) => (
                  <button
                    key={sess.id}
                    onClick={() => {
                      setCurrentSessionId(sess.id);
                      if (onSelectSession) onSelectSession(sess.id);
                      onNavigate("workspace");
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#1a243d] text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="material-symbols-outlined text-sm text-cyan-400">
                        graphic_eq
                      </span>
                      <div className="truncate">
                        <div className="text-xs text-white font-medium truncate">{sess.title}</div>
                        <div className="text-[10px] text-gray-400">{sess.space} • {sess.formattedDuration}</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                      Abrir
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {filteredNotes.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-gray-400">
                Notas Inteligentes Encontradas
              </div>
              <div className="space-y-1">
                {filteredNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => {
                      onNavigate("notes");
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#1a243d] text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="material-symbols-outlined text-sm text-amber-400">
                        sticky_note_2
                      </span>
                      <div className="truncate">
                        <div className="text-xs text-gray-200 group-hover:text-white line-clamp-1">
                          {note.content}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {note.audioTitle} • {note.category}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono shrink-0">
                      {note.timestampFormatted}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {navOptions.length === 0 && filteredSessions.length === 0 && filteredNotes.length === 0 && (
            <div className="py-8 text-center text-xs text-gray-500 space-y-1">
              <span className="material-symbols-outlined text-2xl text-gray-600">search_off</span>
              <p>No se encontraron resultados para "{query}"</p>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-gray-800 bg-[#0c1220] flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-[10px]">↵</kbd> Seleccionar</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-[10px]">ESC</kbd> Salir</span>
          </div>
          <span className="font-mono text-cyan-400">VozNotAI Command Palette</span>
        </div>
      </div>
    </div>
  );
};
