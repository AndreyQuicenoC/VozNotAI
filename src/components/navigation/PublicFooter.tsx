import React from "react";

interface PublicFooterProps {
  onNavigate: (path: string) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#080e1e] border-t border-[#24293b]/50 shadow-[0_-1px_16px_rgba(0,0,0,0.3)] mt-16 select-none">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <button
              onClick={() => onNavigate("inicio")}
              className="flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#48d9e8] to-[#7287ff] p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-[#080e1e] rounded-[6px] flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[#48d9e8] text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    water_drop
                  </span>
                </div>
              </div>
              <span className="font-['Space_Grotesk'] text-lg font-semibold text-[#dde2f9]">
                VozNot<span className="text-[#48d9e8]">AI</span>
              </span>
            </button>
            <p className="text-xs text-[#c5c5d7] leading-relaxed">
              La voz toma forma: información fluida, precisa y estructurada en clústeres de inferencia
              determinista sin latencia.
            </p>
            <div className="text-[11px] text-[#c5c5d7]/80">
              Una iniciativa de <span className="text-[#48d9e8] font-medium">ClustLayer</span> &{" "}
              <span className="text-[#bac3ff] font-medium">Eureka Solutions</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-[#dde2f9] uppercase tracking-wider block">
              Plataforma
            </span>
            <ul className="space-y-2 text-xs text-[#c5c5d7]">
              <li>
                <button
                  onClick={() => onNavigate("funcionalidades")}
                  className="hover:text-[#48d9e8] transition-colors"
                >
                  Funcionalidades
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("como-funciona")}
                  className="hover:text-[#48d9e8] transition-colors"
                >
                  Arquitectura Whisper CUDA
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("manual")}
                  className="hover:text-[#48d9e8] transition-colors"
                >
                  Manual de Operación
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("acerca-de")}
                  className="hover:text-[#48d9e8] transition-colors"
                >
                  Acerca de Eureka & Autoría
                </button>
              </li>
            </ul>
          </div>

          {/* Governance & Legal */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-[#dde2f9] uppercase tracking-wider block">
              Gobernanza & Legal
            </span>
            <ul className="space-y-2 text-xs text-[#c5c5d7]">
              <li>
                <button
                  onClick={() => onNavigate("privacidad")}
                  className="hover:text-[#48d9e8] transition-colors"
                >
                  Política de Privacidad Zero-Retention
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("privacidad")}
                  className="hover:text-[#48d9e8] transition-colors"
                >
                  Términos de Servicio & Confidencialidad
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("acerca-de")}
                  className="hover:text-[#48d9e8] transition-colors"
                >
                  Seguridad y Auditoría ISO/IEC 25010
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("manual")}
                  className="hover:text-[#48d9e8] transition-colors"
                >
                  Documentación API & Protocolos
                </button>
              </li>
            </ul>
          </div>

          {/* Processing Engine Indicator */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-[#dde2f9] uppercase tracking-wider block">
              Motor de Procesamiento
            </span>
            <p className="text-xs text-[#c5c5d7]">Selecciona el backend predeterminado de inferencia vocal:</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#151b2c] border border-[#24293b]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#48d9e8] animate-pulse"></span>
                  <span className="font-['Space_Grotesk'] text-xs text-[#dde2f9]">
                    Cluster Local Whisper CUDA
                  </span>
                </div>
                <span className="text-[10px] text-[#48d9e8] bg-[#24293b] px-1.5 py-0.5 rounded font-semibold">
                  v3 Turbo
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#151b2c] border border-[#24293b]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8f8fa0]"></span>
                  <span className="font-['Space_Grotesk'] text-xs text-[#c5c5d7]">
                    Nube Privada ClustLayer
                  </span>
                </div>
                <span className="text-[10px] text-[#c5c5d7] bg-[#24293b] px-1.5 py-0.5 rounded font-semibold">
                  Latencia Cero
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="pt-6 border-t border-[#24293b]/40 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#c5c5d7]/70">
          <p>© 2025 VozNotAI por ClustLayer / Eureka Solutions. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2">
            <span>Desarrollado por</span>
            <a
              href="https://github.com/AndreyQuicenoC"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#48d9e8] hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">code</span>
              Andrey Quiceno
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
