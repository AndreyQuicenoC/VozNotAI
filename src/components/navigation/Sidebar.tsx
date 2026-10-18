import React, { useState } from "react";
import { useVozNotStore } from "../../services/store.ts";
import { normalizeRoute, type AppRoute } from "../../utils/routes.ts";

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: AppRoute) => void;
  onOpenUploadModal?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  onOpenUploadModal,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { currentUser } = useVozNotStore();
  const isAdmin = currentUser?.role === "admin";
  const canonicalRoute = normalizeRoute(currentPath);

  const navItems = [
    { id: "dashboard" as AppRoute, label: "Dashboard", icon: "grid_view" },
    { id: "workspace" as AppRoute, label: "Espacio de Trabajo", icon: "graphic_eq" },
    { id: "notes" as AppRoute, label: "Notas Inteligentes", icon: "auto_awesome" },
    { id: "admin" as AppRoute, label: "Panel Administrador", icon: "admin_panel_settings", adminOnly: true },
    { id: "ai-config" as AppRoute, label: "Configuración de IA", icon: "neurology" },
    { id: "manual" as AppRoute, label: "Manual", icon: "menu_book" },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 bg-[#080e1e] z-50 flex flex-col justify-between py-4 border-r border-[#24293b]/40 select-none transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
      aria-label="Barra de Navegación Lateral"
    >
      <div className="flex flex-col gap-6 px-3">
        {/* Brand Header & Collapse Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer overflow-hidden"
            title="Ir a inicio de VozNotAI"
          >
            {/* Authentic 3D Isotype Voice Waveform Drop */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#48d9e8] via-[#7287ff] to-[#9b7fed] p-0.5 flex items-center justify-center shadow-[0_0_12px_rgba(72,217,232,0.35)] shrink-0 transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-[#080e1e] rounded-[9px] flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[#48d9e8] text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  water_drop
                </span>
              </div>
            </div>

            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <div className="flex items-center font-['Space_Grotesk'] text-lg font-semibold text-[#dde2f9] tracking-tight">
                  <span>VozNot</span>
                  <span className="text-[#48d9e8]">AI</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-[#c5c5d7]/60 font-medium truncate">
                  ClustLayer • Eureka
                </span>
              </div>
            )}
          </button>

          {/* Sidebar Collapse Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#191f30] transition-colors cursor-pointer shrink-0"
              title={isCollapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
            >
              <span className="material-symbols-outlined text-lg">
                {isCollapsed ? "chevron_right" : "chevron_left"}
              </span>
            </button>
          )}
        </div>

        {/* Quick Upload Action Button */}
        {onOpenUploadModal && (
          <button
            onClick={onOpenUploadModal}
            className={`w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer ${
              isCollapsed ? "px-0" : "px-3"
            }`}
            title="Cargar nuevo archivo de audio"
          >
            <span className="material-symbols-outlined text-base">upload_file</span>
            {!isCollapsed && <span>Cargar Audio</span>}
          </button>
        )}

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5" aria-label="Menú principal">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) {
              return null;
            }
            const isActive = canonicalRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? "page" : undefined}
                title={item.label}
                className={`flex items-center rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  isCollapsed ? "justify-center p-3" : "gap-3 px-3.5 py-2.5"
                } ${
                  isActive
                    ? "bg-[#1d2740] text-[#48d9e8] font-semibold shadow-sm border border-cyan-500/30"
                    : "text-[#c5c5d7] hover:bg-[#151d33] hover:text-[#dde2f9]"
                }`}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info: TECHNICAL INFO VISIBLE ONLY TO ADMIN */}
      <div className="px-3 flex flex-col gap-2 text-[#c5c5d7] text-xs">
        {isAdmin && !isCollapsed && (
          <div className="p-3 rounded-xl bg-[#131b2e] flex flex-col gap-1 border border-cyan-500/20 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#48d9e8] animate-pulse"></span>
              <span className="text-xs font-semibold text-[#dde2f9]">CUDA Core Activo</span>
            </div>
            <span className="font-['Space_Grotesk'] text-[11px] text-[#c5c5d7]/70">
              v2.8.4 Enterprise • Nodo 01
            </span>
          </div>
        )}

        {/* Andrey Quiceno Developer Badge */}
        {!isCollapsed && (
          <a
            href="https://github.com/AndreyQuicenoC"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg hover:bg-[#191f30] flex items-center justify-between text-[#c5c5d7] hover:text-[#48d9e8] transition-colors text-[11px]"
            title="Ver perfil de GitHub de Andrey Quiceno"
          >
            <span className="truncate">Andrey Quiceno</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>
        )}
      </div>
    </aside>
  );
};
