import React, { useState } from "react";

export const ManualView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("inicio");

  const sections = [
    { id: "inicio", title: "1. Guía Rápida de Inicio", icon: "rocket_launch" },
    { id: "formatos", title: "2. Formatos y Carga de Audio", icon: "upload_file" },
    { id: "workspace", title: "3. Espacio de Trabajo & Scrubbing", icon: "graphic_eq" },
    { id: "diarizacion", title: "4. Diarización de Locutores", icon: "record_voice_over" },
    { id: "notas", title: "5. Notas Inteligentes y Resumen", icon: "sticky_note_2" },
    { id: "exportacion", title: "6. Exportación (SRT, VTT, JSON)", icon: "download" },
    { id: "atajos", title: "7. Atajos de Teclado", icon: "keyboard" },
    { id: "roles", title: "8. Roles y Permisos del Sistema", icon: "shield_person" },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-[#11192e] to-[#121c33] border border-cyan-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1">
            <span className="material-symbols-outlined text-sm">menu_book</span>
            Documentación Oficial ClustLayer • Eureka
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            Manual del Operador & Guía de Usuario
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Instrucciones exhaustivas para la gestión de transcripciones de alta fidelidad,
            diarización espectral forense y aprovechamiento de la inferencia acelerada por hardware.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 rounded-xl bg-[#18233e] hover:bg-[#202e52] border border-gray-700 text-xs font-semibold text-gray-200 transition-colors flex items-center gap-2 cursor-pointer shadow-sm self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-sm text-cyan-400">print</span>
          Imprimir / Guardar como PDF
        </button>
      </div>

      {/* Main Split Layout: Table of Contents & Guide Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left TOC Navigation (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="p-4 rounded-xl bg-[#0f172a] border border-gray-800 space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-2 px-2">
              Índice de Contenidos
            </div>
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                  activeSection === sec.id
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold"
                    : "text-gray-400 hover:bg-[#151d33] hover:text-white border border-transparent"
                }`}
              >
                <span className="material-symbols-outlined text-sm">{sec.icon}</span>
                <span>{sec.title}</span>
              </button>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-[#0b101e] border border-gray-800/80 text-xs text-gray-400 space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-cyan-400 text-sm">support_agent</span>
              ¿Necesitas asistencia técnica?
            </div>
            <p className="text-[11px] leading-relaxed">
              Comunícate con el administrador de tu clúster institucional en{" "}
              <span className="text-cyan-400 font-mono">soporte@clustlayer.org</span>.
            </p>
          </div>
        </div>

        {/* Right Content Reader (8 cols) */}
        <div className="lg:col-span-8 p-6 md:p-8 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-6">
          {activeSection === "inicio" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">rocket_launch</span>
                1. Guía Rápida de Inicio
              </h2>
              <p className="text-xs text-gray-300 leading-relaxed">
                VozNotAI es una plataforma diseñada para proporcionar transcripciones automáticas
                con precisión superior al 98% a través de modelos Whisper optimizados para hardware
                soberano. Los audios se procesan localmente sin depender de transferencias a centros
                de datos comerciales extranjeros.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-[#141d33] border border-gray-800 space-y-1.5">
                  <span className="text-xs font-semibold text-cyan-400">Paso 1: Cargar tu Audio</span>
                  <p className="text-[11px] text-gray-300">
                    Desde el Dashboard, haz clic en "+ Nueva Transcripción" o arrastra tu archivo a la zona de carga.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#141d33] border border-gray-800 space-y-1.5">
                  <span className="text-xs font-semibold text-cyan-400">Paso 2: Inferencia Automática</span>
                  <p className="text-[11px] text-gray-300">
                    El clúster balancea automáticamente la tarea entre los núcleos CUDA asignados.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#141d33] border border-gray-800 space-y-1.5">
                  <span className="text-xs font-semibold text-cyan-400">Paso 3: Revisión & Notas</span>
                  <p className="text-[11px] text-gray-300">
                    Navega por la pista interactiva, busca palabras clave y genera notas vinculadas al tiempo.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#141d33] border border-gray-800 space-y-1.5">
                  <span className="text-xs font-semibold text-cyan-400">Paso 4: Exportar Resultados</span>
                  <p className="text-[11px] text-gray-300">
                    Descarga subtítulos listos para video (SRT / VTT) o reportes ejecutivos en texto.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === "formatos" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">upload_file</span>
                2. Formatos y Carga de Audio
              </h2>
              <p className="text-xs text-gray-300 leading-relaxed">
                El motor acústico admite los estándares industriales más utilizados. Para máxima
                fidelidad forense o legal, se recomienda utilizar grabaciones sin compresión con
                pérdidas.
              </p>
              <div className="space-y-2">
                {[
                  { ext: "WAV", desc: "Lineal PCM sin compresión. Máxima fidelidad fonética recomendada.", rate: "16-bit o 24-bit, 44.1/48kHz" },
                  { ext: "FLAC", desc: "Compresión sin pérdida de calidad. Reduce el tamaño un 50% con calidad idéntica a WAV.", rate: "Hasta 24-bit, 96kHz" },
                  { ext: "MP3 / M4A", desc: "Formatos comprimidos estándar para reuniones y entrevistas largas.", rate: "128kbps a 320kbps" },
                  { ext: "OGG / WebM", desc: "Formatos web eficientes compatibles con grabaciones directas de navegador.", rate: "Opus audio codec" },
                ].map((f) => (
                  <div key={f.ext} className="p-3 rounded-xl bg-[#141d33] border border-gray-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-mono text-cyan-400 font-bold mr-2">{f.ext}</span>
                      <span className="text-gray-300">{f.desc}</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap ml-4">{f.rate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "workspace" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">graphic_eq</span>
                3. Espacio de Trabajo & Scrubbing Acústico
              </h2>
              <p className="text-xs text-gray-300 leading-relaxed">
                El visualizador de onda te permite escuchar cualquier fragmento con precisión
                milimétrica. Al hacer clic en cualquier barra del waveform o en un párrafo de la
                transcripción, el reproductor saltará automáticamente a ese segundo.
              </p>
              <div className="p-4 rounded-xl bg-[#111827]/80 border border-gray-800 space-y-2 text-xs">
                <div className="text-white font-semibold">Selector de Velocidad Dinámica</div>
                <p className="text-gray-400 leading-relaxed">
                  Puedes acelerar la reproducción a 1.25x, 1.5x o 2x para auditorías rápidas, o
                  reducirla a 0.75x para desambiguar términos médicos o fonemas complejos.
                </p>
              </div>
            </div>
          )}

          {activeSection === "diarizacion" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">record_voice_over</span>
                4. Diarización de Locutores
              </h2>
              <p className="text-xs text-gray-300 leading-relaxed">
                Mediante el pipeline de PyAnnote integrado, el sistema separa las voces de los
                diferentes interlocutores. Cada intervención queda etiquetada con su respectivo
                nombre y color característico.
              </p>
            </div>
          )}

          {activeSection === "notas" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">sticky_note_2</span>
                5. Notas Inteligentes y Resumen Ejecutivo
              </h2>
              <p className="text-xs text-gray-300 leading-relaxed">
                Presiona "Anotar en [marca]" en el reproductor para registrar un acuerdo o hallazgo
                en ese segundo específico. Las notas quedan sincronizadas y accesibles en el
                Centro de Notas Inteligentes.
              </p>
            </div>
          )}

          {activeSection === "exportacion" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">download</span>
                6. Exportación Multi-formato
              </h2>
              <p className="text-xs text-gray-300 leading-relaxed">
                Puedes descargar tu transcripción en formatos especializados:
              </p>
              <ul className="list-disc pl-5 text-xs text-gray-400 space-y-1.5">
                <li><strong className="text-white">Subtítulos SRT:</strong> Formato universal con marcas de tiempo en formato <code className="text-cyan-400">00:00:00,000</code>.</li>
                <li><strong className="text-white">WebVTT (.vtt):</strong> Estándar para reproductores web HTML5.</li>
                <li><strong className="text-white">Texto Plano (.txt):</strong> Formateado con interlocutores y marcas de tiempo para lectura ejecutiva.</li>
                <li><strong className="text-white">JSON Estructurado:</strong> Contiene metadatos de confianza, tokens y segmentos para integración en pipelines de datos.</li>
              </ul>
            </div>
          )}

          {activeSection === "atajos" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">keyboard</span>
                7. Atajos de Teclado del Sistema
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { key: "/", desc: "Abrir Paleta de Búsqueda Global (Command Palette)" },
                  { key: "Espacio", desc: "Reproducir / Pausar el audio en el Workspace" },
                  { key: "← / →", desc: "Retroceder / Avanzar 5 segundos en la pista" },
                  { key: "Esc", desc: "Cerrar ventanas modales o menús desplegables" },
                ].map((s) => (
                  <div key={s.key} className="p-3 rounded-xl bg-[#141d33] border border-gray-800 flex justify-between items-center">
                    <span className="text-gray-300">{s.desc}</span>
                    <kbd className="px-2 py-1 rounded bg-[#1c2847] border border-gray-700 font-mono text-cyan-400 font-bold ml-2">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "roles" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">shield_person</span>
                8. Roles y Permisos de Operación
              </h2>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[#141d33] border border-gray-800">
                  <div className="font-semibold text-cyan-400">Operador Estándar (Customer)</div>
                  <p className="text-gray-400 text-[11px] mt-1">
                    Carga audios, revisa transcripciones, genera notas y exporta reportes. La selección del motor de inferencia es administrada centralmente por el clúster.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#141d33] border border-gray-800">
                  <div className="font-semibold text-purple-400">Auditor Forense (Auditor)</div>
                  <p className="text-gray-400 text-[11px] mt-1">
                    Acceso a certificados criptográficos de trazabilidad y verificación de custodia acústica.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#141d33] border border-gray-800">
                  <div className="font-semibold text-red-400">Administrador de Clúster (Admin)</div>
                  <p className="text-gray-400 text-[11px] mt-1">
                    Control absoluto del clúster CUDA, selección del modo del sistema (Local vs API Cloud), balanceador de carga, reinicio de workers y asignación de cuotas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
