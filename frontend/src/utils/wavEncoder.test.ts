import test from "node:test";
import assert from "node:assert/strict";
import { encodePcmToWav } from "./wavEncoder.ts";

test("encodePcmToWav writes a PCM WAV header and the expected payload size", () => {
  const samples = new Float32Array([0, 0.5, -1, 1]);
  const wav = encodePcmToWav([samples], 16000);

  assert.equal(String.fromCharCode(...wav.slice(0, 4)), "RIFF");
  assert.equal(String.fromCharCode(...wav.slice(8, 12)), "WAVE");
  assert.equal(String.fromCharCode(...wav.slice(36, 40)), "data");
  assert.equal(wav.length, 44 + samples.length * 2);
  assert.equal(wav[20], 1);
  assert.equal(wav[22], 1);
});

test("encodePcmToWav rejects an empty recording", () => {
  assert.throws(() => encodePcmToWav([new Float32Array(0)], 16000), /no contiene muestras/);
});
