import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluatePasswordStrength,
  validateAudioFile,
  sanitizeEndpointUrl,
} from "./securityValidator.ts";

test("evaluatePasswordStrength rates passwords correctly", () => {
  const empty = evaluatePasswordStrength("");
  assert.equal(empty.score, 0);
  assert.equal(empty.label, "Sin ingresar");

  const weak = evaluatePasswordStrength("abcdef");
  assert.equal(weak.label, "Muy Débil");

  const medium = evaluatePasswordStrength("Abcdef12");
  assert.equal(medium.score, 3);
  assert.equal(medium.label, "Aceptable");

  const strong = evaluatePasswordStrength("VozNotAI#2026!MasterSecureClustLayer");
  assert.equal(strong.score, 4);
  assert.equal(strong.label, "Robusta / Criptográfica");
});

test("evaluatePasswordStrength returns detailed boolean checks", () => {
  const res = evaluatePasswordStrength("Passw0rd!");
  assert.equal(res.checks.length, true);
  assert.equal(res.checks.uppercase, true);
  assert.equal(res.checks.number, true);
  assert.equal(res.checks.symbol, true);
});

test("validateAudioFile accepts valid audio formats and rejects oversized or empty files", () => {
  const validFile = {
    name: "test_recording.wav",
    size: 10 * 1024 * 1024,
    type: "audio/wav",
  } as unknown as File;
  assert.equal(validateAudioFile(validFile).valid, true);

  const flacFile = {
    name: "forensic_audio.flac",
    size: 25 * 1024 * 1024,
    type: "audio/flac",
  } as unknown as File;
  assert.equal(validateAudioFile(flacFile).valid, true);

  const mp3File = {
    name: "meeting.mp3",
    size: 5 * 1024 * 1024,
    type: "audio/mpeg",
  } as unknown as File;
  assert.equal(validateAudioFile(mp3File).valid, true);

  const oggFile = {
    name: "voice.ogg",
    size: 2 * 1024 * 1024,
    type: "audio/ogg",
  } as unknown as File;
  assert.equal(validateAudioFile(oggFile).valid, true);

  const oversizedFile = {
    name: "huge.wav",
    size: 600 * 1024 * 1024,
    type: "audio/wav",
  } as unknown as File;
  const oversizedRes = validateAudioFile(oversizedFile);
  assert.equal(oversizedRes.valid, false);
  assert.ok(oversizedRes.error?.includes("25 MB"));

  const invalidExt = {
    name: "malicious.exe",
    size: 1024,
    type: "application/x-msdownload",
  } as unknown as File;
  assert.equal(validateAudioFile(invalidExt).valid, false);

  const emptyFile = {
    name: "empty.wav",
    size: 0,
    type: "audio/wav",
  } as unknown as File;
  assert.equal(validateAudioFile(emptyFile).valid, false);
});

test("sanitizeEndpointUrl validates https and blocks SSRF hosts", () => {
  assert.equal(sanitizeEndpointUrl("https://api.openai.com/v1").valid, true);
  assert.equal(sanitizeEndpointUrl("https://cluster-gateway.eureka.edu").valid, true);
  assert.equal(sanitizeEndpointUrl("https://api.groq.com/openai/v1").valid, true);

  const httpRes = sanitizeEndpointUrl("http://api.openai.com/v1");
  assert.equal(httpRes.valid, false);
  assert.ok(httpRes.error?.includes("HTTPS"));

  assert.equal(sanitizeEndpointUrl("https://localhost:8080/api").valid, false);
  assert.equal(sanitizeEndpointUrl("https://127.0.0.1/api").valid, false);
  assert.equal(sanitizeEndpointUrl("https://169.254.169.254/latest/meta-data").valid, false);
  assert.equal(sanitizeEndpointUrl("https://0.0.0.0/api").valid, false);
  assert.equal(sanitizeEndpointUrl("not-a-valid-url").valid, false);
});
