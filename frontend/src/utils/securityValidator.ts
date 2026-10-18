/**
 * Security and input validation utilities for VozNotAI
 */

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  label: "Sin ingresar" | "Muy Débil" | "Baja" | "Aceptable" | "Robusta / Criptográfica";
  checks: {
    length: boolean;
    uppercase: boolean;
    number: boolean;
    symbol: boolean;
  };
}

/**
 * Evaluates password strength according to ISO/IEC and enterprise guidelines
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password || password.length === 0) {
    return {
      score: 0,
      label: "Sin ingresar",
      checks: { length: false, uppercase: false, number: false, symbol: false },
    };
  }

  const length = password.length >= 8;
  const uppercase = /[A-Z]/.test(password);
  const number = /[0-9]/.test(password);
  const symbol = /[^A-Za-z0-9]/.test(password);

  const score = (length ? 1 : 0) + (uppercase ? 1 : 0) + (number ? 1 : 0) + (symbol ? 1 : 0);

  let label: PasswordStrengthResult["label"] = "Muy Débil";
  if (score === 0 || score === 1) label = "Muy Débil";
  else if (score === 2) label = "Baja";
  else if (score === 3) label = "Aceptable";
  else if (score === 4) label = "Robusta / Criptográfica";

  return {
    score,
    label,
    checks: { length, uppercase, number, symbol },
  };
}

/**
 * Validates audio file constraints: format and size (25 MB by default, matching the API).
 */
export function validateAudioFile(
  file: { name: string; size: number; type?: string },
  maxSizeBytes: number = 25 * 1024 * 1024
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No se proporcionó ningún archivo de audio." };
  }

  if (file.size <= 0) {
    return { valid: false, error: "El archivo de audio está vacío (0 bytes)." };
  }

  if (file.size > maxSizeBytes) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `El archivo excede el tamaño máximo permitido de 25 MB (tamaño actual: ${sizeMb} MB).`,
    };
  }

  const extensionMatch = file.name.match(/\.([0-9a-z]+)$/i);
  const ext = extensionMatch ? extensionMatch[1].toLowerCase() : "";

  const allowedExtensions = ["wav", "mp3", "m4a", "flac", "ogg"];
  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Formato de audio '.${ext}' no compatible. Utilice WAV, MP3, M4A, FLAC u OGG.`,
    };
  }

  return { valid: true };
}

/**
 * Sanitizes and verifies an external endpoint URL for SSRF protection
 */
export function sanitizeEndpointUrl(rawUrl: string): { valid: boolean; error?: string } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, error: "La URL del endpoint no puede estar vacía." };
  }

  try {
    const parsed = new URL(rawUrl);

    if (parsed.protocol !== "https:") {
      return {
        valid: false,
        error: "Por motivos de seguridad, solo se permiten conexiones cifradas HTTPS.",
      };
    }

    // Block private/loopback/cloud-metadata hosts (SSRF prevention)
    const hostname = parsed.hostname.toLowerCase();
    const isBlocked =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.endsWith(".internal") ||
      hostname === "169.254.169.254"; // AWS/GCP metadata server

    if (isBlocked) {
      return {
        valid: false,
        error: "Host restringido: No se permite conectar a direcciones de loopback o metadatos internos.",
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Formato de URL inválido." };
  }
}
