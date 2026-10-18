import React, { useState } from "react";
import { useVozNotStore } from "../../services/store.ts";

interface LoginViewProps {
  onNavigate: (path: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate }) => {
  const { login, users } = useVozNotStore();

  const [email, setEmail] = useState("adolfo.quiceno@correounivalle.edu.co");
  const [password, setPassword] = useState("VozNot#Secure2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const success = login(email, password);
      setLoading(false);
      if (success) {
        onNavigate("dashboard");
      } else {
        setError("Credenciales no válidas en el nodo ClustLayer o usuario suspendido.");
      }
    }, 400);
  };

  const handleQuickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("VozNot#Secure2026!");
    const success = login(userEmail, "VozNot#Secure2026!");
    if (success) {
      onNavigate("dashboard");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="w-full max-w-md space-y-8 bg-[#0f172a]/95 border border-gray-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
            <span className="material-symbols-outlined text-sm">lock</span>
            Acceso Criptográfico Seguro
          </div>

          <h2 className="text-2xl font-display font-bold text-white tracking-tight">
            Iniciar Sesión en VozNotAI
          </h2>

          <p className="text-xs text-gray-400">
            Conéctate a tu clúster de transcripción Whisper local y soberana.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-gray-400 block mb-1">
              Correo Institucional o Corporativo:
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                mail
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operador@institucion.edu"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#18233e] border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-mono text-gray-400">Contraseña:</label>
              <button
                type="button"
                onClick={() => onNavigate("recovery")}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono transition-colors cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                key
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#18233e] border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-700 bg-[#18233e] text-cyan-500 focus:ring-0"
              />
              Recordar este terminal
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-sm">login</span>
            )}
            {loading ? "Autenticando en Clúster..." : "Iniciar Sesión en Clúster"}
          </button>
        </form>

        {/* Quick Demo Operator Picker */}
        <div className="pt-4 border-t border-gray-800 space-y-3">
          <div className="text-center text-[11px] font-mono text-gray-500 uppercase tracking-wider">
            Acceso Rápido con Perfiles Demo
          </div>
          <div className="grid grid-cols-3 gap-2">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => handleQuickLogin(u.email)}
                className="p-2 rounded-xl bg-[#141c30] hover:bg-[#1b2540] border border-gray-800 text-left transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-semibold text-white group-hover:text-cyan-400 truncate">
                  {u.name.split(" ")[0]}
                </div>
                <div className="text-[10px] text-gray-500 uppercase font-mono">{u.role}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-gray-400">
          ¿No tienes una cuenta de operador?{" "}
          <button
            onClick={() => onNavigate("register")}
            className="text-cyan-400 hover:underline font-semibold cursor-pointer"
          >
            Registrarme aquí
          </button>
        </div>
      </div>
    </div>
  );
};
