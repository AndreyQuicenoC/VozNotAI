import React, { useState, useMemo } from "react";
import { evaluatePasswordStrength } from "../../utils/securityValidator.ts";

interface PasswordRecoveryViewProps {
  onNavigate: (path: string) => void;
}

export const PasswordRecoveryView: React.FC<PasswordRecoveryViewProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("adolfo.quiceno@correounivalle.edu.co");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const strength = useMemo(() => evaluatePasswordStrength(newPassword), [newPassword]);

  const handleSendToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Por favor ingresa un correo institucional válido.");
      return;
    }
    setError(null);
    setStatusMessage("Token criptográfico de 6 dígitos enviado al nodo de correo seguro.");
    setTimeout(() => {
      setStep(2);
      setOtpCode("849201"); // Auto-fill demo OTP token for smooth user testing
    }, 800);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      setError("El código OTP debe ser de 6 dígitos.");
      return;
    }
    setError(null);
    setStatusMessage("Token verificado por la firma del clúster.");
    setStep(3);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas ingresadas no coinciden.");
      return;
    }
    if (strength.score < 2) {
      setError("La nueva clave debe tener al menos nivel Aceptable.");
      return;
    }

    setError(null);
    setStatusMessage("¡Contraseña restablecida exitosamente! Redirigiendo al login...");
    setTimeout(() => {
      onNavigate("login");
    }, 1500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="w-full max-w-md space-y-6 bg-[#0f172a]/95 border border-gray-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
            <span className="material-symbols-outlined text-sm">lock_reset</span>
            Protocolo Zero-Trust de Recuperación
          </div>

          <h2 className="text-2xl font-display font-bold text-white tracking-tight">
            Restablecer Clave de Acceso
          </h2>

          <p className="text-xs text-gray-400">
            Paso {step} de 3 • Verificación criptográfica para operadores del clúster.
          </p>
        </div>

        {statusMessage && (
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">info</span>
            {statusMessage}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        {/* Step 1: Request OTP */}
        {step === 1 && (
          <form onSubmit={handleSendToken} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1">
                Correo Registrado en ClustLayer:
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#18233e] border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              Te enviaremos un desafío numérico único firmado con la clave pública de tu tenant
              corporativo.
            </p>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              Enviar Desafío OTP
            </button>
          </form>
        )}

        {/* Step 2: Validate OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1">
                Código OTP de Seguridad (6 dígitos):
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#18233e] border border-cyan-500/50 text-white font-mono text-center tracking-widest text-lg focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-cyan-400 font-mono mt-1 block text-center">
                (Token de demostración autocompletado: 849201)
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs transition-colors cursor-pointer"
              >
                Atrás
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">verified</span>
                Validar Token
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Set New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1">
                Nueva Contraseña:
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingresa la nueva clave..."
                className="w-full px-3 py-2 rounded-xl bg-[#18233e] border border-gray-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              />

              {newPassword.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400 font-mono">Fortaleza:</span>
                    <span className="text-cyan-400 font-semibold">{strength.label}</span>
                  </div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
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

            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1">
                Confirmar Nueva Contraseña:
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva clave..."
                className="w-full px-3 py-2 rounded-xl bg-[#18233e] border border-gray-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span className="material-symbols-outlined text-sm font-bold">check</span>
              Guardar Nueva Clave y Salir
            </button>
          </form>
        )}

        <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-800">
          ¿Recordaste tu contraseña?{" "}
          <button
            onClick={() => onNavigate("login")}
            className="text-cyan-400 hover:underline font-semibold cursor-pointer"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
};
