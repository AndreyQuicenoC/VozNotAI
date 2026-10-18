import React, { useState, useMemo } from "react";
import { useVozNotStore } from "../../services/store.ts";
import { evaluatePasswordStrength } from "../../utils/securityValidator.ts";
interface RegisterViewProps {
  onNavigate: (path: string) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onNavigate }) => {
  const { register } = useVozNotStore();

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = useMemo(() => evaluatePasswordStrength(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!termsAccepted) {
      setError("Debes aceptar la política de datos para crear la cuenta.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setSubmitting(true);
    const created = await register({
      name,
      lastName,
      email,
      password,
    });
    setSubmitting(false);

    if (created) {
      onNavigate("dashboard");
    } else {
      setError("No se pudo crear la cuenta. Revisa el correo o la contraseña.");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="w-full max-w-lg space-y-6 bg-[#0f172a]/95 border border-gray-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
            <span className="material-symbols-outlined text-sm">person_add</span>
            Nuevo Operador de Clúster
          </div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight">
            Crear Cuenta en VozNotAI
          </h2>
          <p className="text-xs text-gray-400">
            Crea tu cuenta para subir audio y guardar la transcripción.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1">Nombre:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Carlos"
                className="w-full px-3 py-2 rounded-xl bg-[#18233e] border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1">Apellidos:</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Mendoza"
                className="w-full px-3 py-2 rounded-xl bg-[#18233e] border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-gray-400 block mb-1">Correo Electrónico:</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operador@investigacion.org"
              className="w-full px-3 py-2 rounded-xl bg-[#18233e] border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <p className="text-[11px] text-gray-400">
            Las cuentas nuevas se crean como cliente. El rol de administrador solo se asigna en el servidor.
          </p>

          <div>
            <label className="text-xs font-mono text-gray-400 block mb-1">Contraseña:</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres, números y símbolos"
                className="w-full px-3 pr-10 py-2 rounded-xl bg-[#18233e] border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
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

            {/* Strength meter bar */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-400 font-mono">Fortaleza Criptográfica:</span>
                  <span
                    className={`font-semibold ${
                      strength.score <= 1
                        ? "text-red-400"
                        : strength.score === 2
                        ? "text-amber-400"
                        : strength.score === 3
                        ? "text-blue-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {strength.label}
                  </span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      strength.score <= 1
                        ? "bg-red-500 w-1/4"
                        : strength.score === 2
                        ? "bg-amber-400 w-2/4"
                        : strength.score === 3
                        ? "bg-blue-400 w-3/4"
                        : "bg-emerald-400 w-full"
                    }`}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-400">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded border-gray-700 bg-[#18233e] text-cyan-500 focus:ring-0"
              />
              <span>
                Acepto el acuerdo de soberanía acústica y confirmo que los audios se procesarán bajo
                las políticas locales de confidencialidad de ClustLayer • Eureka.
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <span className="material-symbols-outlined text-sm">how_to_reg</span>
            Registrar Operador en Clúster
          </button>
        </form>

        <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-800">
          ¿Ya posees credenciales activas?{" "}
          <button
            onClick={() => onNavigate("login")}
            className="text-cyan-400 hover:underline font-semibold cursor-pointer"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
};
