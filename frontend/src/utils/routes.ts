/**
 * Centralized Route Aliasing & Permissions for VozNotAI
 */

export type AppRoute =
  | "home"
  | "features"
  | "how-it-works"
  | "privacy"
  | "dashboard"
  | "workspace"
  | "notes"
  | "admin"
  | "ai-config"
  | "manual"
  | "profile"
  | "about"
  | "login"
  | "register"
  | "recovery";

const ROUTE_ALIASES: Record<string, AppRoute> = {
  // English standard
  home: "home",
  features: "features",
  "how-it-works": "how-it-works",
  privacy: "privacy",
  dashboard: "dashboard",
  workspace: "workspace",
  notes: "notes",
  admin: "admin",
  "ai-config": "ai-config",
  manual: "manual",
  profile: "profile",
  about: "about",
  login: "login",
  register: "register",
  recovery: "recovery",

  // Spanish aliases
  inicio: "home",
  funcionalidades: "features",
  "como-funciona": "how-it-works",
  privacidad: "privacy",
  "espacio-de-trabajo": "workspace",
  "notas-inteligentes": "notes",
  "panel-administrador": "admin",
  "configuracion-de-ia": "ai-config",
  "configuraciones-de-la-ia": "ai-config",
  "mi-perfil": "profile",
  perfil: "profile",
  "acerca-de": "about",
  "conoce-voznotai": "about",
  "iniciar-sesion": "login",
  registro: "register",
  recuperar: "recovery",
  "recuperar-contrasena": "recovery",
};

/**
 * Normalizes any route string or URL hash to a canonical AppRoute
 */
export function isKnownRoute(rawPath: string): boolean {
  const clean = rawPath.replace(/^#\/?/, "").trim().toLowerCase();
  if (!clean) return true;
  return Boolean(ROUTE_ALIASES[clean]);
}

export function normalizeRoute(rawPath: string): AppRoute {
  const clean = rawPath.replace(/^#\/?/, "").trim().toLowerCase();
  if (!clean) return "home";
  if (ROUTE_ALIASES[clean]) {
    return ROUTE_ALIASES[clean];
  }
  return "dashboard";
}

/**
 * Checks if a given route is reserved for administrators only
 */
export function isAdminOnlyRoute(route: AppRoute): boolean {
  return route === "admin";
}

/**
 * Checks if a given route is a public authentication/landing route
 */
export function isPublicRoute(route: AppRoute): boolean {
  return (
    route === "home" ||
    route === "features" ||
    route === "how-it-works" ||
    route === "privacy" ||
    route === "about" ||
    route === "login" ||
    route === "register" ||
    route === "recovery"
  );
}

/** Manual stays inside the app shell after login, and is readable before login. */
export function isAccessibleWithoutAuth(route: AppRoute): boolean {
  return isPublicRoute(route) || route === "manual";
}
