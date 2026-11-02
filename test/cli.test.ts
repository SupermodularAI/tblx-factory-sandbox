import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
const sample = fileURLToPath(new URL("../data/sample-trips.json", import.meta.url));
const run = (...args: string[]) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
const serviceLines = (stdout: string) => stdout.split("\n").filter((line) => line.startsWith("service "));

test("report without --margin uses the 1000 km default", () => {
  const result = run(sample);
  assert.equal(result.status, 0);
  assert.equal(
    result.stdout,
    [
      "TRK-001: 2 trips, 8.5 h, 29 l/100km",
      "TRK-002: 1 trips, 3.5 h, 33 l/100km",
      "TRK-003: 1 trips, 4 h, 0 l/100km",
      "service due: TRK-001 (350 km)",
    ].join("\n") + "\n",
  );
});

test("--margin after the data file widens the service-due report", () => {
  const result = run(sample, "--margin", "20000");
  assert.equal(result.status, 0);
  assert.deepEqual(serviceLines(result.stdout), ["service due: TRK-001 (350 km)", "service due: TRK-002 (11800 km)"]);
});

test("--margin before the data file gives the same report", () => {
  const before = run("--margin", "20000", sample);
  assert.equal(before.status, 0);
  assert.equal(before.stdout, run(sample, "--margin", "20000").stdout);
});

test("--margin 0 lists only overdue vehicles and vehicles exactly at their service point", () => {
  const dir = mkdtempSync(join(tmpdir(), "fleet-cli-"));
  const file = join(dir, "data.json");
  const vehicle = (id: string) => ({ id, model: "Actros", lastServiceKm: 0, serviceIntervalKm: 1000 });
  const trip = (vehicleId: string, odometerKm: number) => ({
    vehicleId,
    startedAt: "2026-10-01T08:00:00Z",
    endedAt: "2026-10-01T10:00:00Z",
    distanceKm: 100,
    fuelLitres: 30,
    odometerKm,
  });
  writeFileSync(
    file,
    JSON.stringify({
      vehicles: [vehicle("OVER"), vehicle("EXACT"), vehicle("NEAR")],
      trips: [trip("OVER", 1100), trip("EXACT", 1000), trip("NEAR", 999)],
    }),
  );
  const result = run(file, "--margin", "0");
  assert.equal(result.status, 0);
  assert.deepEqual(serviceLines(result.stdout), ["service OVERDUE: OVER (-100 km)", "service due: EXACT (0 km)"]);
});

for (const [name, args] of [
  ["non-numeric", ["--margin", "abc"]],
  ["negative", ["--margin", "-5"]],
  ["missing", ["--margin"]],
] as const) {
  test(`a ${name} --margin is rejected with exit code 2`, () => {
    const result = run(sample, ...args);
    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /--margin/);
  });
}
