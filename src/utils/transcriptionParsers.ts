/**
 * Transcription formatting and export utilities (SRT, WebVTT, Plain text, JSON)
 */

import { formatTimestampSrt, formatTimestampVtt } from "./costCalculator.ts";

export interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  speaker: string;
  speakerRole?: string;
  text: string;
  confidence?: number;
}

/**
 * Converts segments into SubRip (.srt) format
 */
export function exportToSrt(segments: TranscriptSegment[]): string {
  if (!segments || segments.length === 0) return "";
  
  return segments
    .map((seg, index) => {
      const idx = index + 1;
      const start = formatTimestampSrt(seg.start);
      const end = formatTimestampSrt(seg.end);
      const text = `${seg.speaker ? `[${seg.speaker}] ` : ""}${seg.text.trim()}`;
      return `${idx}\n${start} --> ${end}\n${text}\n`;
    })
    .join("\n");
}

/**
 * Converts segments into WebVTT (.vtt) format
 */
export function exportToWebVtt(segments: TranscriptSegment[], title: string = "VozNotAI WebVTT"): string {
  let vtt = `WEBVTT - ${title}\n\n`;
  if (!segments || segments.length === 0) return vtt;

  const entries = segments.map((seg, index) => {
    const idx = index + 1;
    const start = formatTimestampVtt(seg.start);
    const end = formatTimestampVtt(seg.end);
    const speakerVoice = seg.speaker ? `<v ${seg.speaker}>` : "";
    return `${idx}\n${start} --> ${end}\n${speakerVoice}${seg.text.trim()}`;
  });

  return vtt + entries.join("\n\n") + "\n";
}

/**
 * Formats transcript as clean plain text with speaker headers
 */
export function exportToPlainText(segments: TranscriptSegment[], title: string = "Transcripción VozNotAI"): string {
  const header = `==========================================================\n${title.toUpperCase()}\nMotor: Whisper Local / ClustLayer Architecture\nGenerado con: VozNotAI Enterprise\n==========================================================\n\n`;
  
  if (!segments || segments.length === 0) return header;

  const body = segments
    .map((seg) => {
      const startStr = formatTimestampSrt(seg.start).split(",")[0];
      const speakerTag = seg.speaker ? `${seg.speaker}${seg.speakerRole ? ` (${seg.speakerRole})` : ""}` : "Hablante";
      return `[${startStr}] ${speakerTag}:\n${seg.text.trim()}\n`;
    })
    .join("\n");

  return header + body;
}

/**
 * Exports structured JSON representation
 */
export function exportToJson(segments: TranscriptSegment[], metadata: Record<string, unknown> = {}): string {
  const payload = {
    app: "VozNotAI",
    version: "2.8.4",
    ecosystem: "ClustLayer / Eureka Solutions",
    exportedAt: new Date().toISOString(),
    metadata,
    segmentCount: segments.length,
    segments
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Searches keywords across transcript segments
 */
export function searchTranscript(
  segments: TranscriptSegment[],
  keyword: string
): { totalMatches: number; matchingSegmentIds: string[] } {
  if (!keyword || !keyword.trim()) {
    return { totalMatches: 0, matchingSegmentIds: [] };
  }

  const cleanKeyword = keyword.trim().toLowerCase();
  let totalMatches = 0;
  const matchingSegmentIds: string[] = [];

  for (const seg of segments) {
    const textLower = seg.text.toLowerCase();
    const matchesInSegment = (textLower.match(new RegExp(escapeRegex(cleanKeyword), "g")) || []).length;
    if (matchesInSegment > 0) {
      totalMatches += matchesInSegment;
      matchingSegmentIds.push(seg.id);
    }
  }

  return { totalMatches, matchingSegmentIds };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
