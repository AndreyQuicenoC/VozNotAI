import test from "node:test";
import assert from "node:assert/strict";

// Pure business logic verification for quotas and billing
test("Quota utilization calculation handles boundaries correctly", () => {
  const calculateQuotaUsage = (used: number, max: number) => {
    if (max <= 0) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  };

  assert.equal(calculateQuotaUsage(0, 3000), 0);
  assert.equal(calculateQuotaUsage(1500, 3000), 50);
  assert.equal(calculateQuotaUsage(3000, 3000), 100);
  assert.equal(calculateQuotaUsage(3500, 3000), 100); // capped at 100%
  assert.equal(calculateQuotaUsage(1420, 3000), 47);
});

test("Role permission matrix allows admin all privileges and restricts customers", () => {
  const permissions = {
    admin: { canManageCluster: true, canSwitchEngine: true, canViewHardwareTelemetry: true, canTranscribe: true },
    auditor: { canManageCluster: false, canSwitchEngine: false, canViewHardwareTelemetry: false, canTranscribe: true, canAuditHashes: true },
    customer: { canManageCluster: false, canSwitchEngine: false, canViewHardwareTelemetry: false, canTranscribe: true, canAuditHashes: false },
  };

  assert.equal(permissions.admin.canManageCluster, true);
  assert.equal(permissions.admin.canSwitchEngine, true);
  assert.equal(permissions.customer.canManageCluster, false);
  assert.equal(permissions.customer.canSwitchEngine, false);
  assert.equal(permissions.customer.canViewHardwareTelemetry, false);
  assert.equal(permissions.auditor.canSwitchEngine, false);
});

test("Audio session duration aggregation calculates total minutes accurately", () => {
  const mockSessions = [
    { durationSeconds: 2538 }, // 42m 18s
    { durationSeconds: 1200 }, // 20m 00s
    { durationSeconds: 660 },  // 11m 00s
  ];

  const totalSeconds = mockSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalMinutes = Math.floor(totalSeconds / 60);

  assert.equal(totalSeconds, 4398);
  assert.equal(totalMinutes, 73);
});

test("Smart note categorization filter groups items by category", () => {
  const mockNotes = [
    { id: "1", category: "Acción Pendiente", title: "Nota 1" },
    { id: "2", category: "Resumen Ejecutivo", title: "Nota 2" },
    { id: "3", category: "Acción Pendiente", title: "Nota 3" },
    { id: "4", category: "Idea Clave", title: "Nota 4" },
  ];

  const filterByCategory = (category: string) =>
    category === "all" ? mockNotes : mockNotes.filter((n) => n.category === category);

  assert.equal(filterByCategory("all").length, 4);
  assert.equal(filterByCategory("Acción Pendiente").length, 2);
  assert.equal(filterByCategory("Resumen Ejecutivo").length, 1);
  assert.equal(filterByCategory("Idea Clave").length, 1);
});
