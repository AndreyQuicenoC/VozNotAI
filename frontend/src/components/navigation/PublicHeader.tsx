import React, { useState } from "react";

interface PublicHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ currentPath, onNavigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { id: "home", label: "Inicio" },
    { id: "features", label: "Funcionalidades" },
    { id: "how-it-works", label: "Cómo Funciona" },
    { id: "privacy", label: "Privacidad" },
    { id: "about", label: "Acerca de" },
    { id: "manual", label: "Manual" },
  ];

  const go = (path: string) => {
    setMenuOpen(false);
    onNavigate(path);
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-[#080e1e]/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.24)] border-b border-[#24293b]/40">
      <div className="h-20 max-w-7xl mx-auto px-8 flex items-center justify-between gap-6">
        {/* Brand */}
        <button
          onClick={() => go("home")}
          className="flex items-center gap-3 group focus:outline-none text-left"
          title="Ir a inicio"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#48d9e8] via-[#7287ff] to-[#9b7fed] p-0.5 flex items-center justify-center shadow-[0_0_16px_rgba(72,217,232,0.3)] group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#080e1e] rounded-[10px] flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[#48d9e8] text-[22px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                water_drop
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center font-['Space_Grotesk'] text-xl tracking-tight text-[#dde2f9] font-semibold">
              <span>VozNot</span>
              <span className="text-[#48d9e8]">AI</span>
            </div>
            <span className="text-[11px] tracking-wider uppercase text-[#c5c5d7]/70 font-medium">
              ClustLayer • Eureka
            </span>
          </div>
        </button>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#151b2c]/60 p-1.5 rounded-full backdrop-blur-md border border-[#24293b]/50">
          {links.map((link) => {
            const isActive = currentPath === link.id;
            return (
              <button
                key={link.id}
                onClick={() => go(link.id)}
                aria-current={isActive ? "page" : undefined}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                  isActive
                    ? "bg-[#24293b] text-[#dde2f9] font-semibold shadow-sm"
                    : "text-[#c5c5d7] hover:text-[#dde2f9] hover:bg-[#24293b]/60"
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => go("login")}
            className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-[#191f30] text-sm text-[#dde2f9] hover:bg-[#24293b] hover:text-[#48d9e8] transition-all border border-[#24293b]"
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => go("register")}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00b7c6] via-[#7287ff] to-[#9b7fed] text-sm text-[#001f90] font-semibold shadow-[0_0_20px_rgba(72,217,232,0.35)] hover:brightness-110 transition-all"
          >
            Comenzar Gratis
          </button>
          <button
            type="button"
            className="lg:hidden px-3 py-2 rounded-lg border border-[#24293b] text-sm text-[#dde2f9]"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            Menú
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="lg:hidden border-t border-[#24293b] bg-[#080e1e] px-6 py-3 flex flex-col gap-1">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => go(link.id)}
              className="text-left px-3 py-2 rounded-lg text-sm text-[#c5c5d7] hover:bg-[#24293b]"
            >
              {link.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
};
