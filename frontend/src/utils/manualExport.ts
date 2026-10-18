import { OPERATOR_MANUAL_META, OPERATOR_MANUAL_SECTIONS, type ManualSection } from "../content/operatorManual.ts";

function sectionToMarkdown(section: ManualSection): string {
  const lines = [`## ${section.title}`, "", ...(section.paragraphs ?? []).map((p) => p.trim()), ""];
  if (section.bullets?.length) {
    lines.push(...section.bullets.map((item) => `- ${item}`), "");
  }
  return lines.join("\n");
}

export function buildManualMarkdown(): string {
  const header = [
    `# ${OPERATOR_MANUAL_META.title}`,
    "",
    `**Versión:** ${OPERATOR_MANUAL_META.version}  `,
    `**Organización:** ${OPERATOR_MANUAL_META.organization}  `,
    `**Autores:** ${OPERATOR_MANUAL_META.authors}`,
    "",
    "---",
    "",
  ].join("\n");
  return header + OPERATOR_MANUAL_SECTIONS.map(sectionToMarkdown).join("\n");
}

export function buildManualHtmlDocument(): string {
  const sections = OPERATOR_MANUAL_SECTIONS.map((section) => {
    const body = (section.paragraphs ?? []).map((p) => `<p>${escapeHtml(p)}</p>`).join("");
    const list = section.bullets?.length
      ? `<ul>${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : "";
    return `<section><h2>${escapeHtml(section.title)}</h2>${body}${list}</section>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(OPERATOR_MANUAL_META.title)}</title>
  <style>
    body { font-family: "Segoe UI", system-ui, sans-serif; color: #0f172a; max-width: 820px; margin: 40px auto; padding: 0 24px 48px; line-height: 1.65; }
    header { border-bottom: 3px solid #0891b2; padding-bottom: 16px; margin-bottom: 32px; }
    h1 { font-size: 28px; margin: 0 0 8px; color: #0e7490; }
    .meta { font-size: 13px; color: #475569; }
    h2 { font-size: 18px; margin: 28px 0 10px; color: #164e63; }
    p { margin: 0 0 10px; font-size: 14px; }
    ul { margin: 0 0 12px 20px; padding: 0; }
    li { margin-bottom: 6px; font-size: 14px; }
    footer { margin-top: 40px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    @media print { body { margin: 24px; } }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(OPERATOR_MANUAL_META.title)}</h1>
    <p class="meta">Versión ${escapeHtml(OPERATOR_MANUAL_META.version)} · ${escapeHtml(OPERATOR_MANUAL_META.organization)}</p>
    <p class="meta">${escapeHtml(OPERATOR_MANUAL_META.authors)}</p>
  </header>
  ${sections}
  <footer>Documento generado por VozNotAI. No incluye métricas inventadas ni certificaciones legales.</footer>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadManualMarkdown(): void {
  const blob = new Blob([buildManualMarkdown()], { type: "text/markdown;charset=utf-8" });
  downloadBlob("VozNotAI-Manual.md", blob);
}

export function downloadManualHtml(): void {
  const blob = new Blob([buildManualHtmlDocument()], { type: "text/html;charset=utf-8" });
  downloadBlob("VozNotAI-Manual.html", blob);
}
