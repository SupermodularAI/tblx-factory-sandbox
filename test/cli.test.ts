import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const cli = (...args: string[]) => spawnSync(process.execPath, ["src/cli.ts", ...args], { encoding: "utf8" });
const usage = "usage: node src/cli.ts <data.json> [--vehicle <id>]\n";

test("without --vehicle the report is unchanged", () => {
  const r = cli("data/sample-trips.json");
  assert.equal(r.status, 0);
  assert.equal(
    r.stdout,
    "TRK-001: 2 trips, 8.5 h, 29 l/100km\nTRK-002: 1 trips, 3.5 h, 33 l/100km\nTRK-003: 1 trips, 4 h, 0 l/100km\nservice due: TRK-001 (350 km)\n",
  );
  assert.equal(r.stderr, "");
});

test("--vehicle prints only that vehicle's trip and service line", () => {
  const r = cli("data/sample-trips.json", "--vehicle", "TRK-001");
  assert.equal(r.status, 0);
  assert.equal(r.stdout, "TRK-001: 2 trips, 8.5 h, 29 l/100km\nservice due: TRK-001 (350 km)\n");
});

test("--vehicle for a vehicle not due prints only its trip line", () => {
  const r = cli("data/sample-trips.json", "--vehicle", "TRK-002");
  assert.equal(r.status, 0);
  assert.equal(r.stdout, "TRK-002: 1 trips, 3.5 h, 33 l/100km\n");
});

test("unknown vehicle exits 1", () => {
  const r = cli("data/sample-trips.json", "--vehicle", "TRK-999");
  assert.equal(r.status, 1);
  assert.equal(r.stderr, "unknown vehicle: TRK-999\n");
  assert.equal(r.stdout, "");
});

test("--vehicle without a value prints usage and exits 2", () => {
  const r = cli("data/sample-trips.json", "--vehicle");
  assert.equal(r.status, 2);
  assert.equal(r.stderr, usage);
  assert.equal(r.stdout, "");
});
