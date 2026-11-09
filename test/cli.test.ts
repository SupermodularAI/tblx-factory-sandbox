import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cli = (file: string) => spawnSync(process.execPath, ["src/cli.ts", file], { encoding: "utf8" });
const dataFile = (data: unknown): string => {
  const file = join(mkdtempSync(join(tmpdir(), "fleet-")), "data.json");
  writeFileSync(file, JSON.stringify(data));
  return file;
};
const trip = (vehicleId: string, endedAt: string, driverId?: string) => ({
  vehicleId,
  startedAt: "2026-10-01T08:00:00Z",
  endedAt,
  distanceKm: 100,
  fuelLitres: 30,
  odometerKm: 1000,
  ...(driverId === undefined ? {} : { driverId }),
});

test("prints driver lines after the vehicle lines, sorted, unassigned last", () => {
  const file = dataFile({
    vehicles: [],
    trips: [trip("V1", "2026-10-01T10:00:00Z", "D2"), trip("V1", "2026-10-01T09:00:00Z"), trip("V2", "2026-10-01T08:30:00Z", "D1")],
  });
  const out = cli(file);
  assert.equal(out.status, 0);
  assert.equal(
    out.stdout,
    "V1: 2 trips, 3 h, 30 l/100km\nV2: 1 trips, 0.5 h, 30 l/100km\ndriver D1: 0.5 h\ndriver D2: 2 h\ndriver unassigned: 1 h\n",
  );
});

test("output is unchanged when no trip has a driver", () => {
  const out = cli("data/sample-trips.json");
  assert.equal(out.status, 0);
  assert.equal(
    out.stdout,
    "TRK-001: 2 trips, 8.5 h, 29 l/100km\nTRK-002: 1 trips, 3.5 h, 33 l/100km\nTRK-003: 1 trips, 4 h, 0 l/100km\nservice due: TRK-001 (350 km)\n",
  );
});

test("driver lines come before service lines", () => {
  const file = dataFile({
    vehicles: [{ id: "V1", model: "Actros", lastServiceKm: 0, serviceIntervalKm: 1500 }],
    trips: [trip("V1", "2026-10-01T10:00:00Z", "D1")],
  });
  assert.deepEqual(cli(file).stdout.trimEnd().split("\n"), ["V1: 1 trips, 2 h, 30 l/100km", "driver D1: 2 h", "service due: V1 (500 km)"]);
});
