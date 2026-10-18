import React, { useState, useRef, useEffect } from "react";
import { useVozNotStore } from "../../services/store.ts";
import type { AppRoute } from "../../utils/routes.ts";

interface HeaderProps {
  onNavigate: (path: AppRoute) => void;
  onOpenSearch?: () => void;
  isCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  onOpenSearch,
  isCollapsed = false,
}) => {
  const { currentUser, logout, engineStatus } = useVozNotStore();
  const isAdmin = currentUser?.role === "admin";
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut '/' to open spotlight search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        if (onOpenSearch) onOpenSearch();
      }
      if (e.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenSearch]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    await logout();
    onNavigate("login");
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-[#0d1323]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.4)] z-40 flex items-center justify-between px-6 border-b border-[#24293b]/40 transition-all duration-300 ${
        isCollapsed ? "left-20" : "left-64"
      }`}
    >
      {/* Search Input Box (Clicks open full Command Palette modal) */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div
          onClick={onOpenSearch}
          className="relative w-full cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (onOpenSearch) onOpenSearch();
            }
          }}
          aria-label="Abrir buscador global"
        >
          <div className="w-full pl-9 pr-10 py-1.5 rounded-lg bg-[#151b2c] text-[#dde2f9] text-xs placeholder:text-[#8f8fa0] border border-[#24293b]/60 group-hover:border-cyan-500/50 flex items-center transition-all select-none">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              search
            </span>
            <span className="text-gray-400">Buscar sesiones, notas, o presiona '/' para consultar...</span>
          </div>
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-[#2f3446] text-[#c5c5d7] font-mono text-[11px] pointer-events-none">
            /
          </kbd>
        </div>

        <span className="hidden xl:inline-flex px-2.5 py-1 rounded-lg bg-[#19223a] text-[#48d9e8] text-xs font-medium whitespace-nowrap border border-[#48d9e8]/20">
          ClustLayer / Eureka
        </span>
      </div>

      {/* Right Controls: Engine Badge (ADMIN ONLY) & User Profile */}
      <div className="flex items-center gap-4">
        {/* Whisper Local Status Pill — ONLY VISIBLE TO ADMIN */}
        {isAdmin ? (
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#191f30] text-[#dde2f9] border border-[#24293b]"
            title={engineStatus?.local_details || "Estado del motor de transcripción"}
          >
            <span className={`w-2 h-2 rounded-full ${engineStatus?.local_available ? "bg-[#48d9e8]" : "bg-amber-400"}`}></span>
            <span className="font-['Space_Grotesk'] text-xs text-[#c5c5d7]">
              {engineStatus?.local_available
                ? `Whisper local disponible (${engineStatus.active_model})`
                : "Whisper local no disponible"}
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#11192e] text-[#8ea0cf] border border-gray-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Servicio Operativo</span>
          </div>
        )}

        {/* Profile Card & Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#191f30] transition-colors focus:outline-none focus:ring-2 focus:ring-[#48d9e8] cursor-pointer"
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="true"
            aria-label="Menú de usuario"
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-[#48d9e8]/40"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#7287ff]/20 text-[#bac3ff] font-bold text-xs flex items-center justify-center border border-[#7287ff]/40">
                {currentUser?.name?.[0] || "U"}
              </div>
            )}
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-[#dde2f9] leading-tight">
                {currentUser?.name} {currentUser?.lastName}
              </span>
              <span className="text-[10px] text-[#48d9e8] leading-tight mt-0.5 font-medium">
                {currentUser?.roleTitle || currentUser?.role}
              </span>
            </div>
            <span className="material-symbols-outlined text-[16px] text-[#8f8fa0]">
              expand_more
            </span>
          </button>

          {/* User Switcher Dropdown */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[#151b2c] rounded-2xl shadow-2xl border border-[#24293b] p-2 z-50 flex flex-col gap-1 animate-fade-in">
              <div className="p-2.5 border-b border-[#24293b]/70 flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-[#dde2f9]">
                  {currentUser?.name} {currentUser?.lastName}
                </span>
                <span className="text-[11px] text-[#c5c5d7] truncate">{currentUser?.email}</span>
                <span className="text-[10px] text-[#48d9e8] mt-0.5 font-medium">
                  {currentUser?.organization}
                </span>
              </div>

              {/* Navigation Options */}
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onNavigate("profile");
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-[#dde2f9] hover:bg-[#191f30] hover:text-[#48d9e8] text-left transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">badge</span>
                <span>Mi Perfil & Cuotas</span>
              </button>

              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onNavigate("workspace");
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-[#dde2f9] hover:bg-[#191f30] hover:text-[#48d9e8] text-left transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
                <span>Espacio de Trabajo</span>
              </button>

              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onNavigate("manual");
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-[#dde2f9] hover:bg-[#191f30] hover:text-[#48d9e8] text-left transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                <span>Manual de Operador</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onNavigate("admin");
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-[#dde2f9] hover:bg-[#191f30] hover:text-[#48d9e8] text-left transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                  <span>Panel Administrador</span>
                </button>
              )}

              {/* Logout */}
              <div className="pt-1.5 border-t border-[#24293b]/70">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 text-left transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
