# Reporte de integración

## HU-001 — Continuar VozNotAI desde el estado existente

**Fecha validación:** 2026-10-18

### Contrato
- El frontend usa `/api/v1` mediante el proxy de Vite.
- La sesión viaja en cookie. El token en memoria solo refuerza la pestaña actual.

### Flujo
1. Registro o login.
2. `GET /auth/me` al recargar, si la cookie sigue vigente.
3. Conversaciones, transcripciones, notas, uso y estado del motor.
4. Carga de audio a `POST /transcriptions/upload`.
5. Cierre de sesión.

### Pendiente de evidencia de navegador
No se recorrió el flujo en un navegador en esta corrida. La evidencia automatizada es la de pytest y las pruebas de Node, cuando consten en el reporte de implementación.
