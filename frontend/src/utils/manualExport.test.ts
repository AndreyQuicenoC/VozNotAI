import assert from "node:assert/strict";
import test from "node:test";
import { buildManualHtmlDocument, buildManualMarkdown } from "./manualExport.ts";

test("manual export includes all sections and avoids printing the live page", () => {
  const md = buildManualMarkdown();
  assert.match(md, /Manual del operador/);
  assert.match(md, /## 1\. Guía rápida de inicio/);
  assert.match(md, /## 9\. Despliegue y motor API/);
  const html = buildManualHtmlDocument();
  assert.match(html, /<title>Manual del operador/);
  assert.match(html, /Espacio de trabajo/);
});
