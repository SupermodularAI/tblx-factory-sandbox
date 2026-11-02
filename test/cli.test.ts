import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
const data = fileURLToPath(new URL("../data/sample-trips.json", import.meta.url));

const run = (...args: string[]) => {
  const { status, stdout, stderr } = spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
  return { status, stdout, stderr };
};
const serviceLines = (stdout: string) => stdout.split("\n").filter((line) => line.startsWith("service "));

test("cli uses a 1000 km margin by default", () => {
  const result = run(data);
  assert.equal(result.status, 0);
  assert.deepEqual(serviceLines(result.stdout), ["service due: TRK-001 (350 km)"]);
  assert.equal(result.stdout, run(data, "--margin", "1000").stdout);
});

test("cli accepts --margin after the data file", () => {
  const result = run(data, "--margin", "15000");
  assert.equal(result.status, 0);
  assert.deepEqual(serviceLines(result.stdout), ["service due: TRK-001 (350 km)", "service due: TRK-002 (11800 km)"]);
});

test("cli accepts --margin before the data file", () => {
  const result = run("--margin", "15000", data);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, run(data, "--margin", "15000").stdout);
});

test("cli with --margin 0 lists only overdue and exactly-due vehicles", () => {
  const dir = mkdtempSync(join(tmpdir(), "fleet-"));
  try {
    const fixture = join(dir, "data.json");
    const vehicles = ["OVER", "AT", "AHEAD"].map((id) => ({ id, model: "Actros", lastServiceKm: 0, serviceIntervalKm: 1000 }));
    const trips = [
      ["OVER", 1100],
      ["AT", 1000],
      ["AHEAD", 900],
    ].map(([vehicleId, odometerKm]) => ({
      vehicleId,
      startedAt: "2026-10-01T08:00:00Z",
      endedAt: "2026-10-01T10:00:00Z",
      distanceKm: 100,
      fuelLitres: 30,
      odometerKm,
    }));
    writeFileSync(fixture, JSON.stringify({ vehicles, trips }));
    const result = run("--margin", "0", fixture);
    assert.equal(result.status, 0);
    assert.deepEqual(serviceLines(result.stdout), ["service OVERDUE: OVER (-100 km)", "service due: AT (0 km)"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("cli rejects a missing, non-numeric or negative margin with exit code 2", () => {
  for (const args of [[data, "--margin"], [data, "--margin", "abc"], [data, "--margin", "12km"], [data, "--margin", ""], [data, "--margin", "-5"]]) {
    const result = run(...args);
    assert.equal(result.status, 2, `status for ${JSON.stringify(args)}`);
    assert.equal(result.stdout, "", `stdout for ${JSON.stringify(args)}`);
    assert.match(result.stderr, /--margin/, `stderr for ${JSON.stringify(args)}`);
  }
});

test("cli prints the usage line without a data file", () => {
  const result = run();
  assert.equal(result.status, 2);
  assert.ok(result.stderr.includes("usage: node src/cli.ts [--margin <km>] <data.json>"));
});
