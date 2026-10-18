/**
 * Converts browser microphone recordings into a real PCM WAV file.
 * MediaRecorder produces WebM or MP4; renaming that blob to .wav fails
 * the backend magic-byte check.
 */

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

export function encodePcmToWav(channels: Float32Array[], sampleRate: number): Uint8Array {
  if (channels.length === 0 || channels[0].length === 0) {
    throw new Error("La grabación no contiene muestras de audio.");
  }
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new Error("La frecuencia de muestreo de la grabación no es válida.");
  }

  const channelCount = channels.length;
  const sampleCount = channels[0].length;
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = sampleCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      const sample = channels[channelIndex][sampleIndex] ?? 0;
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
      offset += 2;
    }
  }

  return new Uint8Array(buffer);
}

export async function encodeBlobToWav(blob: Blob): Promise<Blob> {
  const AudioContextCtor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    throw new Error("Este navegador no puede convertir la grabación a WAV.");
  }

  const context = new AudioContextCtor();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const channels: Float32Array[] = [];
    for (let index = 0; index < decoded.numberOfChannels; index += 1) {
      channels.push(new Float32Array(decoded.getChannelData(index)));
    }
    const wav = encodePcmToWav(channels, decoded.sampleRate);
    return new Blob([wav], { type: "audio/wav" });
  } finally {
    await context.close();
  }
}
