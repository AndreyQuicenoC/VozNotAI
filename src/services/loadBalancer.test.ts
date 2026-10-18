import test from "node:test";
import assert from "node:assert/strict";
import { loadBalancer } from "./loadBalancer.ts";

test("loadBalancer initializes with GPU workers and default local mode", () => {
  const state = loadBalancer.getState();
  assert.ok(state.workers.length >= 2, "Should have at least 2 GPU workers configured");
  assert.equal(state.systemMode, "local_balanced", "Default mode should be local_balanced");
  assert.ok(state.workers.some((w) => w.id === "worker-gpu-0"), "Should have primary GPU worker");
});

test("loadBalancer rejects system mode changes from non-admin roles", () => {
  const originalMode = loadBalancer.getState().systemMode;
  const resultCustomer = loadBalancer.setSystemMode("cloud_api", "customer");
  assert.equal(resultCustomer, false, "Customer must not be allowed to change system inference mode");

  const resultAuditor = loadBalancer.setSystemMode("cloud_api", "auditor");
  assert.equal(resultAuditor, false, "Auditor must not be allowed to change system inference mode");

  assert.equal(loadBalancer.getState().systemMode, originalMode, "Mode should remain unchanged");
});

test("loadBalancer allows admin to change system mode and algorithm", () => {
  const resultAdmin = loadBalancer.setSystemMode("cloud_api", "admin");
  assert.equal(resultAdmin, true, "Admin should be permitted to change system mode");
  assert.equal(loadBalancer.getState().systemMode, "cloud_api");

  // Switch back to local_balanced
  loadBalancer.setSystemMode("local_balanced", "admin");
  assert.equal(loadBalancer.getState().systemMode, "local_balanced");

  // Algorithm test
  const algResult = loadBalancer.setAlgorithm("round_robin", "admin");
  assert.equal(algResult, true);
  assert.equal(loadBalancer.getState().algorithm, "round_robin");

  loadBalancer.setAlgorithm("least_connections", "admin");
  assert.equal(loadBalancer.getState().algorithm, "least_connections");
});

test("loadBalancer dispatches tasks to local workers and generates job tickets", () => {
  loadBalancer.setSystemMode("local_balanced", "admin");
  const result = loadBalancer.dispatchTask(120); // 2 minute audio

  assert.equal(result.route, "local_gpu");
  assert.ok(result.workerAssigned, "Worker should be assigned");
  assert.ok(result.jobTicket.startsWith("JOB-"), "Ticket ID should follow standard prefix");
  assert.ok(result.estimatedLatencyMs > 0, "Latency should be positive");
});

test("loadBalancer routes to cloud_api when systemMode is cloud_api", () => {
  loadBalancer.setSystemMode("cloud_api", "admin");
  const result = loadBalancer.dispatchTask(180);

  assert.equal(result.route, "cloud_api");
  assert.ok(result.jobTicket.startsWith("JOB-"));

  // Reset back to local_balanced
  loadBalancer.setSystemMode("local_balanced", "admin");
});

test("loadBalancer rejects API endpoint changes from regular users", () => {
  const rejected = loadBalancer.configureApiEndpoint({ endpointUrl: "https://malicious.org" }, "customer");
  assert.equal(rejected, false, "Regular users must not modify API gateway endpoints");
});
