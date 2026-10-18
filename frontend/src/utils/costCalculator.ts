/**
 * Cost calculation and duration formatting for VozNotAI inference engine
 */

export const DEFAULT_COMMERCIAL_API_RATE_PER_MIN = 0.006; // Standard commercial Whisper API rate ($0.006 / min)

/**
 * Calculates the estimated cost in USD based on audio duration in seconds and rate per minute
 */
export function calculateEstimatedCost(durationSeconds: number, ratePerMinute: number = DEFAULT_COMMERCIAL_API_RATE_PER_MIN): number {
  if (durationSeconds <= 0 || ratePerMinute <= 0) return 0;
  const minutes = durationSeconds / 60;
  const cost = minutes * ratePerMinute;
  return Math.round(cost * 1000) / 1000; // Round to 3 decimal places
}

/**
 * Calculates estimated savings when running on-premise CUDA vs commercial APIs
 */
export function calculateSavingsUSD(audioMinutes: number, commercialApiRatePerMinute: number = DEFAULT_COMMERCIAL_API_RATE_PER_MIN): number {
  if (audioMinutes <= 0) return 0;
  const rawSavings = audioMinutes * commercialApiRatePerMinute;
  return Math.round(rawSavings * 100) / 100; // Round to 2 decimal places
}

/**
 * Formats duration in seconds to standard mm:ss or hh:mm:ss
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const totalSeconds = Math.floor(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const paddedMins = String(mins).padStart(2, "0");
  const paddedSecs = String(secs).padStart(2, "0");

  if (hrs > 0) {
    const paddedHrs = String(hrs).padStart(2, "0");
    return `${paddedHrs}:${paddedMins}:${paddedSecs}`;
  }
  return `${paddedMins}:${paddedSecs}`;
}

/**
 * Formats seconds into SRT timestamp string: 00:04:18,000
 */
export function formatTimestampSrt(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00:00,000";
  const totalMillis = Math.round(seconds * 1000);
  const millis = totalMillis % 1000;
  const totalSecs = Math.floor(totalMillis / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

/**
 * Formats seconds into WebVTT timestamp string: 00:04:18.000
 */
export function formatTimestampVtt(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00:00.000";
  const totalMillis = Math.round(seconds * 1000);
  const millis = totalMillis % 1000;
  const totalSecs = Math.floor(totalMillis / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}
