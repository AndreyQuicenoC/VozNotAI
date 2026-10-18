import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRoute, isAdminOnlyRoute, isPublicRoute, isAccessibleWithoutAuth } from "./routes.ts";

test("normalizeRoute resolves English canonical routes accurately", () => {
  assert.equal(normalizeRoute("dashboard"), "dashboard");
  assert.equal(normalizeRoute("workspace"), "workspace");
  assert.equal(normalizeRoute("notes"), "notes");
  assert.equal(normalizeRoute("admin"), "admin");
  assert.equal(normalizeRoute("ai-config"), "ai-config");
  assert.equal(normalizeRoute("manual"), "manual");
  assert.equal(normalizeRoute("profile"), "profile");
  assert.equal(normalizeRoute("about"), "about");
  assert.equal(normalizeRoute("login"), "login");
  assert.equal(normalizeRoute("register"), "register");
  assert.equal(normalizeRoute("recovery"), "recovery");
});

test("normalizeRoute resolves Spanish and legacy aliases accurately", () => {
  assert.equal(normalizeRoute("espacio-de-trabajo"), "workspace");
  assert.equal(normalizeRoute("notas-inteligentes"), "notes");
  assert.equal(normalizeRoute("panel-administrador"), "admin");
  assert.equal(normalizeRoute("configuracion-de-ia"), "ai-config");
  assert.equal(normalizeRoute("configuraciones-de-la-ia"), "ai-config");
  assert.equal(normalizeRoute("mi-perfil"), "profile");
  assert.equal(normalizeRoute("perfil"), "profile");
  assert.equal(normalizeRoute("iniciar-sesion"), "login");
  assert.equal(normalizeRoute("registro"), "register");
  assert.equal(normalizeRoute("recuperar"), "recovery");
  assert.equal(normalizeRoute("recuperar-contrasena"), "recovery");
  assert.equal(normalizeRoute("conoce-voznotai"), "about");
  assert.equal(normalizeRoute("inicio"), "home");
  assert.equal(normalizeRoute("funcionalidades"), "features");
  assert.equal(normalizeRoute("como-funciona"), "how-it-works");
  assert.equal(normalizeRoute("privacidad"), "privacy");
});

test("normalizeRoute handles hash prefixes and mixed casing", () => {
  assert.equal(normalizeRoute("#/Workspace"), "workspace");
  assert.equal(normalizeRoute("#/MANUAL"), "manual");
  assert.equal(normalizeRoute("#/Notas-Inteligentes"), "notes");
  assert.equal(normalizeRoute("#/unknown-route-xyz"), "dashboard");
});

test("isAdminOnlyRoute identifies admin-protected routes", () => {
  assert.equal(isAdminOnlyRoute("admin"), true);
  assert.equal(isAdminOnlyRoute("dashboard"), false);
  assert.equal(isAdminOnlyRoute("workspace"), false);
  assert.equal(isAdminOnlyRoute("notes"), false);
  assert.equal(isAdminOnlyRoute("manual"), false);
});

test("isPublicRoute identifies public auth and landing routes", () => {
  assert.equal(isPublicRoute("home"), true);
  assert.equal(isPublicRoute("features"), true);
  assert.equal(isPublicRoute("how-it-works"), true);
  assert.equal(isPublicRoute("privacy"), true);
  assert.equal(isPublicRoute("login"), true);
  assert.equal(isPublicRoute("register"), true);
  assert.equal(isPublicRoute("recovery"), true);
  assert.equal(isPublicRoute("about"), true);
  assert.equal(isPublicRoute("manual"), false);
  assert.equal(isPublicRoute("dashboard"), false);
  assert.equal(isPublicRoute("workspace"), false);
  assert.equal(isPublicRoute("admin"), false);
  assert.equal(isAccessibleWithoutAuth("manual"), true);
  assert.equal(isAccessibleWithoutAuth("dashboard"), false);
});
