import test from "node:test";
import assert from "node:assert/strict";
import {
  exportToSrt,
  exportToWebVtt,
  exportToPlainText,
  exportToJson,
  searchTranscript,
  type TranscriptSegment,
} from "./transcriptionParsers.ts";

const sampleSegments: TranscriptSegment[] = [
  {
    id: "seg-1",
    start: 0,
    end: 4.5,
    speaker: "Andrey Quiceno",
    speakerRole: "Super Admin",
    text: "Iniciamos la sesión de auditoría acústica del clúster VozNotAI.",
    confidence: 0.99,
  },
  {
    id: "seg-2",
    start: 4.8,
    end: 10.2,
    speaker: "Elena Santos",
    speakerRole: "Auditor Forense",
    text: "Confirmamos recepción local en GPU RTX 4090 sin pérdida de paquetes.",
    confidence: 0.985,
  },
  {
    id: "seg-3",
    start: 872.04,
    end: 875.5,
    speaker: "Andrey Quiceno",
    speakerRole: "Super Admin",
    text: "La inferencia se completó con éxito en 42 milisegundos por minuto de audio.",
    confidence: 0.992,
  },
];

test("exportToSrt outputs valid SRT subtitle syntax", () => {
  const srt = exportToSrt(sampleSegments);
  assert.ok(srt.includes("1\n00:00:00,000 --> 00:00:04,500"));
  assert.ok(srt.includes("[Andrey Quiceno] Iniciamos la sesión de auditoría acústica"));
  assert.ok(srt.includes("3\n00:14:32,040 --> 00:14:35,500"));
});

test("exportToSrt handles empty segment array gracefully", () => {
  const empty = exportToSrt([]);
  assert.equal(empty, "");
});

test("exportToWebVtt outputs valid WEBVTT syntax", () => {
  const vtt = exportToWebVtt(sampleSegments, "Auditoria_Test");
  assert.ok(vtt.startsWith("WEBVTT - Auditoria_Test"));
  assert.ok(vtt.includes("00:00:00.000 --> 00:00:04.500"));
  assert.ok(vtt.includes("<v Andrey Quiceno>Iniciamos la sesión"));
});

test("exportToWebVtt handles empty segment array gracefully", () => {
  const vtt = exportToWebVtt([], "Empty");
  assert.ok(vtt.startsWith("WEBVTT - Empty"));
});

test("exportToPlainText outputs formatted transcript", () => {
  const text = exportToPlainText(sampleSegments, "Prueba Acústica");
  assert.ok(text.includes("PRUEBA ACÚSTICA"));
  assert.ok(text.includes("[00:00:00] Andrey Quiceno (Super Admin):\nIniciamos la sesión"));
  assert.ok(text.includes("[00:14:32] Andrey Quiceno (Super Admin):\nLa inferencia se completó"));
});

test("exportToJson generates parseable JSON with segments", () => {
  const jsonStr = exportToJson(sampleSegments, { durationSeconds: 876, space: "Eureka Executive" });
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.metadata.space, "Eureka Executive");
  assert.equal(parsed.segments.length, 3);
  assert.equal(parsed.segments[0].speaker, "Andrey Quiceno");
  assert.equal(parsed.segmentCount, 3);
  assert.equal(parsed.app, "VozNotAI");
});

test("searchTranscript finds keywords and reports total matches and segment IDs", () => {
  const resultRTX = searchTranscript(sampleSegments, "RTX 4090");
  assert.equal(resultRTX.totalMatches, 1);
  assert.deepEqual(resultRTX.matchingSegmentIds, ["seg-2"]);

  const resultAuditoria = searchTranscript(sampleSegments, "auditoría");
  assert.equal(resultAuditoria.totalMatches, 1);
  assert.deepEqual(resultAuditoria.matchingSegmentIds, ["seg-1"]);

  const emptySearch = searchTranscript(sampleSegments, "");
  assert.equal(emptySearch.totalMatches, 0);
  assert.deepEqual(emptySearch.matchingSegmentIds, []);

  const notFound = searchTranscript(sampleSegments, "palabra_inexistente_xyz");
  assert.equal(notFound.totalMatches, 0);
  assert.deepEqual(notFound.matchingSegmentIds, []);
});

test("searchTranscript handles case insensitivity and multiple occurrences", () => {
  const resultInferencia = searchTranscript(sampleSegments, "INFERENCIA");
  assert.equal(resultInferencia.totalMatches, 1);
  assert.equal(resultInferencia.matchingSegmentIds[0], "seg-3");
});
