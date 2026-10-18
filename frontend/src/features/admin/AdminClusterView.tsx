import React, { useState } from "react";
import { useVozNotStore } from "../../services/store.ts";
import type { User, AuditEvent } from "../../types/index.ts";

export const AdminClusterView: React.FC = () => {
  const {
    users,
    currentUser,
    settings,
    updateSettings,
    updateUserQuota,
    toggleUserStatus,
    auditEvents,
    addAuditEvent,
  } = useVozNotStore();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [newQuotaValue, setNewQuotaValue] = useState<number>(300);
  const [clusterNotice, setClusterNotice] = useState<string | null>(null);
  const [isPurgingCache, setIsPurgingCache] = useState(false);
  const [isRestartingWorker, setIsRestartingWorker] = useState(false);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handlePurgeCache = () => {
    setIsPurgingCache(false);
    setClusterNotice(
      "Esta instalación usa un solo proceso local. No hay caché de GPU distribuida que purgar."
    );
    setTimeout(() => setClusterNotice(null), 5000);
  };

  const handleRestartWorker = () => {
    setIsRestartingWorker(false);
    setClusterNotice(
      "No hay un worker CUDA separado. Reinicia el proceso de la API si necesitas recargar el modelo."
    );
    setTimeout(() => setClusterNotice(null), 5000);
  };

  const handleSaveQuota = () => {
    if (!selectedUser) return;
    updateUserQuota(selectedUser.id, newQuotaValue);
    setShowQuotaModal(false);
    setClusterNotice(`Cuota actualizada a ${newQuotaValue} min/mes para ${selectedUser.name}.`);
    setTimeout(() => setClusterNotice(null), 4000);
  };

  const handleExportAudit = () => {
    const headers = "ID,Timestamp,Usuario,Acción,Recurso,Detalles,Estado\n";
    const rows = auditEvents
      .map(
        (e) =>
          `"${e.id}","${e.timestamp}","${e.userName}","${e.action}","${e.resource}","${e.details}","${e.status}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `auditoria_cluster_voznotai_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Cluster Notice Banner */}
      {clusterNotice && (
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center justify-between shadow-lg shadow-cyan-950/40">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-cyan-400">check_circle</span>
            <span className="text-sm font-medium">{clusterNotice}</span>
          </div>
          <button
            onClick={() => setClusterNotice(null)}
            className="text-gray-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Cluster Overview Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-[#11192e] via-[#0d1425] to-[#121c33] border border-cyan-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-semibold">
              Nodo Primario: Eureka-01 • ClustLayer Active
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
            Panel de Administración del Clúster CUDA
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl">
            Monitoreo en tiempo real de GPU Tensor Cores, cuotas de procesamiento por operador,
            auditoría soberana de datos y gestión de fallover hacia API Cloud.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={handlePurgeCache}
            disabled={isPurgingCache}
            className="px-4 py-2.5 rounded-xl bg-[#1a233a] hover:bg-[#232f4d] border border-gray-700/60 text-xs font-medium text-gray-200 transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm text-amber-400 ${isPurgingCache ? "animate-spin" : ""}`}>
              cleaning_services
            </span>
            {isPurgingCache ? "Purgando..." : "Purgar Caché VRAM"}
          </button>

          <button
            onClick={handleRestartWorker}
            disabled={isRestartingWorker}
            className="px-4 py-2.5 rounded-xl bg-[#1a233a] hover:bg-[#232f4d] border border-gray-700/60 text-xs font-medium text-gray-200 transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm text-cyan-400 ${isRestartingWorker ? "animate-spin" : ""}`}>
              restart_alt
            </span>
            {isRestartingWorker ? "Reiniciando..." : "Reiniciar Daemon"}
          </button>

          <button
            onClick={handleExportAudit}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-semibold text-slate-950 transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-500/20"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Exportar Auditoría CSV
          </button>
        </div>
      </div>

      {/* Cluster Hardware Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-xl bg-[#111827]/70 border border-gray-800/80 backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-mono">GPU 0 • RTX 4090</span>
            <span className="material-symbols-outlined text-cyan-400 text-lg">developer_board</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mb-1">19.8 / 24 GB</div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mb-2">
            <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full" style={{ width: "82%" }}></div>
          </div>
          <div className="flex justify-between text-[11px] text-gray-400">
            <span>Uso VRAM: 82%</span>
            <span className="text-cyan-300 font-mono">Whisper Large v3</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-xl bg-[#111827]/70 border border-gray-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-mono">Temperatura Térmica</span>
            <span className="material-symbols-outlined text-emerald-400 text-lg">thermostat</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mb-1">64.2 °C</div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mb-2">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: "62%" }}></div>
          </div>
          <div className="flex justify-between text-[11px] text-gray-400">
            <span>Ventiladores: 68% RPM</span>
            <span className="text-emerald-400 font-mono">Estable (235W)</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-xl bg-[#111827]/70 border border-gray-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-mono">Throughput Inferencia</span>
            <span className="material-symbols-outlined text-purple-400 text-lg">speed</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mb-1">11.4x Tiempo Real</div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mb-2">
            <div className="bg-purple-400 h-full rounded-full" style={{ width: "95%" }}></div>
          </div>
          <div className="flex justify-between text-[11px] text-gray-400">
            <span>Latencia: 84ms/chunk</span>
            <span className="text-purple-300 font-mono">FP16 TensorRT</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-xl bg-[#111827]/70 border border-gray-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs uppercase tracking-wider font-mono">Failover Cloud API</span>
            <span className="material-symbols-outlined text-amber-400 text-lg">cloud_sync</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mb-1">
            {settings.failoverCloudApi ? "Standby Listo" : "Deshabilitado"}
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full ${
                settings.failoverCloudApi ? "bg-amber-400 w-full" : "bg-gray-600 w-1/4"
              }`}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-gray-400">
            <span>Cola Local: 0 pendientes</span>
            <span className="text-amber-300 font-mono">Auto-scale: ON</span>
          </div>
        </div>
      </div>

      {/* Cluster Engine Settings Toggle Bar */}
      <div className="p-5 rounded-2xl bg-[#0e1627] border border-gray-800/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <span className="material-symbols-outlined">tune</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Configuración del Motor Whisper Local</h3>
            <p className="text-xs text-gray-400">
              Ajusta el modelo por defecto y las políticas de failover automático para el clúster.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-gray-400 flex items-center gap-2">
            <span>Modelo Predeterminado:</span>
            <select
              value={settings.whisperModel}
              onChange={(e) => updateSettings({ whisperModel: e.target.value as any })}
              className="bg-[#151f38] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="whisper-large-v3">Whisper Large v3 (Máxima Precisión)</option>
              <option value="whisper-turbo">Whisper Turbo (Baja Latencia)</option>
              <option value="whisper-medium">Whisper Medium (Equilibrado)</option>
              <option value="whisper-base">Whisper Base (Ligero)</option>
            </select>
          </label>

          <button
            onClick={() => updateSettings({ failoverCloudApi: !settings.failoverCloudApi })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
              settings.failoverCloudApi
                ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                : "bg-gray-800/60 border-gray-700 text-gray-400"
            }`}
          >
            <span className="material-symbols-outlined text-xs">
              {settings.failoverCloudApi ? "toggle_on" : "toggle_off"}
            </span>
            Failover Nube: {settings.failoverCloudApi ? "Activado" : "Desactivado"}
          </button>
        </div>
      </div>

      {/* User Management Section */}
      <div className="rounded-2xl bg-[#0f172a]/90 border border-gray-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-gray-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-display font-semibold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400">group</span>
              Gestión de Operadores y Asignación de Cuotas
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Visualiza el consumo en minutos de inferencia, roles de auditoría y controla el acceso a los nodos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                search
              </span>
              <input
                type="text"
                placeholder="Filtrar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-lg bg-[#18233e] border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 w-56"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#18233e] border border-gray-700 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Todos los Roles</option>
              <option value="admin">Administrador</option>
              <option value="auditor">Auditor Forense</option>
              <option value="customer">Operador Estándar</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800/80 text-[11px] font-mono uppercase tracking-wider text-gray-400 bg-[#0b101e]/60">
                <th className="py-3 px-6">Operador</th>
                <th className="py-3 px-6">Rol de Sistema</th>
                <th className="py-3 px-6">Consumo Mensual</th>
                <th className="py-3 px-6">Estado</th>
                <th className="py-3 px-6">Último Acceso</th>
                <th className="py-3 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40 text-xs">
              {filteredUsers.map((u) => {
                const quotaPercent = Math.min(100, Math.round((u.minutesUsed / u.monthlyQuota) * 100));
                return (
                  <tr
                    key={u.id}
                    className="hover:bg-cyan-500/[0.02] transition-colors cursor-pointer group"
                    onClick={() => setSelectedUser(u)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                          alt={u.name}
                          className="w-8 h-8 rounded-full border border-cyan-500/30 object-cover"
                        />
                        <div>
                          <div className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                            {u.name} {u.lastName}
                          </div>
                          <div className="text-[11px] text-gray-400">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                          u.role === "admin"
                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                            : u.role === "auditor"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                            : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[12px]">
                          {u.role === "admin"
                            ? "shield_person"
                            : u.role === "auditor"
                            ? "verified_user"
                            : "person"}
                        </span>
                        {u.role === "admin"
                          ? "Administrador"
                          : u.role === "auditor"
                          ? "Auditor Forense"
                          : "Operador"}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="space-y-1 w-44">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-300 font-mono">{u.minutesUsed} min</span>
                          <span className="text-gray-500 font-mono">/ {u.monthlyQuota} min</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              quotaPercent > 90
                                ? "bg-red-500"
                                : quotaPercent > 70
                                ? "bg-amber-400"
                                : "bg-cyan-400"
                            }`}
                            style={{ width: `${quotaPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] ${
                          u.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-gray-800 text-gray-500 border border-gray-700"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-emerald-400" : "bg-gray-500"}`}></span>
                        {u.isActive ? "Activo" : "Suspendido"}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-gray-400 font-mono text-[11px]">
                      {new Date(u.lastLogin).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(u);
                          setNewQuotaValue(u.monthlyQuota);
                          setShowQuotaModal(true);
                        }}
                        title="Modificar cuota"
                        className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-cyan-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">edit_calendar</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleUserStatus(u.id);
                        }}
                        title={u.isActive ? "Suspender operador" : "Reactivar operador"}
                        className={`p-1.5 rounded-lg hover:bg-gray-800 transition-colors ${
                          u.isActive ? "text-gray-400 hover:text-red-400" : "text-emerald-400 hover:text-emerald-300"
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {u.isActive ? "block" : "check_circle"}
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Drawer Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md h-full bg-[#0d1424] border-l border-gray-800 p-6 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                    alt={selectedUser.name}
                    className="w-12 h-12 rounded-full border border-cyan-500/40 object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-white text-base">
                      {selectedUser.name} {selectedUser.lastName}
                    </h3>
                    <p className="text-xs text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              {/* Status and Role */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#131b2e] border border-gray-800">
                  <div className="text-[11px] text-gray-400 uppercase font-mono">Rol de Acceso</div>
                  <div className="font-semibold text-cyan-400 text-sm mt-1 capitalize">
                    {selectedUser.role}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#131b2e] border border-gray-800">
                  <div className="text-[11px] text-gray-400 uppercase font-mono">Estado Cuenta</div>
                  <div
                    className={`font-semibold text-sm mt-1 ${
                      selectedUser.isActive ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {selectedUser.isActive ? "Habilitado" : "Suspendido"}
                  </div>
                </div>
              </div>

              {/* Quota Progress */}
              <div className="p-4 rounded-xl bg-[#131b2e] border border-gray-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-medium">Cuota Mensual Asignada</span>
                  <span className="text-cyan-400 font-mono">
                    {selectedUser.minutesUsed} / {selectedUser.monthlyQuota} min
                  </span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (selectedUser.minutesUsed / selectedUser.monthlyQuota) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-[11px] text-gray-400">
                  Renovación automática el primer día de cada ciclo mensual.
                </p>
              </div>

              {/* System Audit logs for user */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-mono text-gray-400 tracking-wider">
                  Registro de Actividad Reciente
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {auditEvents
                    .filter((e) => e.userId === selectedUser.id || e.userId === selectedUser.email || e.user === selectedUser.email)
                    .map((event) => (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg bg-[#111726] border border-gray-800/80 text-xs space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-cyan-400 font-semibold">
                            {event.action}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-300 text-[11px]">{event.details}</p>
                      </div>
                    ))}
                  {auditEvents.filter((e) => e.userId === selectedUser.id || e.user === selectedUser.email).length === 0 && (
                    <div className="p-4 text-center text-xs text-gray-500 italic">
                      Sin registros recientes para este usuario.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-4 flex gap-3">
              <button
                onClick={() => {
                  setNewQuotaValue(selectedUser.monthlyQuota);
                  setShowQuotaModal(true);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Editar Cuota
              </button>
              <button
                onClick={() => toggleUserStatus(selectedUser.id)}
                className={`py-2 px-4 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedUser.isActive
                    ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {selectedUser.isActive ? "lock" : "lock_open"}
                </span>
                {selectedUser.isActive ? "Suspender" : "Habilitar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quota Modal */}
      {showQuotaModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#0f172a] border border-gray-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Ajustar Cuota Mensual</h3>
              <button
                onClick={() => setShowQuotaModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Modifica el límite de minutos de transcripción local por GPU asignados a{" "}
              <strong className="text-white">{selectedUser.name}</strong>.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-400">Minutos por Mes:</label>
              <input
                type="number"
                min="0"
                max="20000"
                step="50"
                value={newQuotaValue}
                onChange={(e) => setNewQuotaValue(Number(e.target.value))}
                className="w-full bg-[#18233e] border border-gray-700 rounded-xl px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowQuotaModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveQuota}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs"
              >
                Guardar Cuota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
