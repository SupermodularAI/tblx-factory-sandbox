import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const cli = (...args: string[]) => spawnSync(process.execPath, ["src/cli.ts", ...args], { cwd: root, encoding: "utf8" });
const serviceLines = (stdout: string) => stdout.split("\n").filter((line) => line.startsWith("service "));

// Vehicles A–D are at -100, 1500, 2000 and 2500 km from their next service.
let dir: string;
let file: string;
before(() => {
  dir = mkdtempSync(join(tmpdir(), "fleet-cli-"));
  file = join(dir, "margin.json");
  const odometers: Record<string, number> = { A: 10100, B: 8500, C: 8000, D: 7500 };
  const ids = Object.keys(odometers);
  writeFileSync(
    file,
    JSON.stringify({
      vehicles: ids.map((id) => ({ id, model: "Actros", lastServiceKm: 0, serviceIntervalKm: 10000 })),
      trips: ids.map((id) => ({
        vehicleId: id,
        startedAt: "2026-10-01T08:00:00Z",
        endedAt: "2026-10-01T10:00:00Z",
        distanceKm: 100,
        fuelLitres: 30,
        odometerKm: odometers[id],
      })),
    }),
  );
});
after(() => rmSync(dir, { recursive: true, force: true }));

test("without --margin the report is unchanged", () => {
  const result = cli("data/sample-trips.json");
  assert.equal(result.status, 0);
  assert.equal(
    result.stdout,
    "TRK-001: 2 trips, 8.5 h, 29 l/100km\n" +
      "TRK-002: 1 trips, 3.5 h, 33 l/100km\n" +
      "TRK-003: 1 trips, 4 h, 0 l/100km\n" +
      "service due: TRK-001 (350 km)\n",
  );
  assert.equal(result.stderr, "");
});

test("default margin is 1000 km", () => {
  assert.deepEqual(serviceLines(cli(file).stdout), ["service OVERDUE: A (-100 km)"]);
});

test("--margin lists vehicles within that margin, overdue included", () => {
  const result = cli(file, "--margin", "2000");
  assert.equal(result.status, 0);
  assert.deepEqual(serviceLines(result.stdout), [
    "service OVERDUE: A (-100 km)",
    "service due: B (1500 km)",
    "service due: C (2000 km)",
  ]);
});

test("--margin works on the sample data", () => {
  const result = cli("data/sample-trips.json", "--margin", "2000");
  assert.equal(result.status, 0);
  assert.ok(result.stdout.includes("service due: TRK-001 (350 km)\n"));
});

test("--margin 0 is accepted", () => {
  const result = cli(file, "--margin", "0");
  assert.equal(result.status, 0);
  assert.deepEqual(serviceLines(result.stdout), ["service OVERDUE: A (-100 km)"]);
});

test("invalid --margin exits 2 with a clear error", () => {
  for (const value of [["abc"], ["-5"], []]) {
    const result = cli(file, "--margin", ...value);
    assert.equal(result.status, 2, `--margin ${value.join(" ")}`);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /--margin must be a non-negative number/);
  }
});
