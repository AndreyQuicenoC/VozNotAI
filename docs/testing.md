# Pruebas

## Backend

`pytest` cubre registro, sesión, recuperación, aislamiento entre usuarios, notas, consumo decimal, validación de audio, selección de proveedor y el panel de administración. La transcripción de integración usa un proveedor simulado. No se ejecutó Whisper real en esta continuación porque el entorno de pruebas no carga el modelo en cada caso.

## Frontend

Las pruebas actuales son de Node (`node:test`) sobre calculadora de costo, rutas, validación y el balanceador. No hay todavía Vitest sobre componentes ni Playwright. Esos objetivos del enunciado siguen pendientes.

## Cómo ejecutarlas

```powershell
backend\venv\Scripts\python.exe -m pytest backend/tests --cov=backend --cov-report=term-missing
cd frontend
npx tsx --test src/utils/*.test.ts src/services/*.test.ts
```

Los porcentajes observados se registran en `docs/implementation-report.md` después de ejecutarlas. No se copian cifras de una corrida anterior.
