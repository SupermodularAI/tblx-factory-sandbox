import { readFileSync } from "node:fs";
import { consumptionPer100Km, drivingHours, serviceDue, tripsByVehicle } from "./fleet.ts";
import type { Trip, Vehicle } from "./types.ts";

// Usage: node src/cli.ts [--margin <km>] <data.json>   (data: { vehicles: Vehicle[], trips: Trip[] })
const USAGE = "usage: node src/cli.ts [--margin <km>] <data.json>";

function fail(message: string): never {
  console.error(message);
  console.error(USAGE);
  process.exit(2);
}

const args = process.argv.slice(2);
const positional: string[] = [];
let marginKm = 1000;
for (let i = 0; i < args.length; i++) {
  if (args[i] !== "--margin") {
    positional.push(args[i]);
    continue;
  }
  const value = args[++i];
  if (value === undefined) fail("error: --margin needs a value in km");
  const km = Number(value);
  if (value.trim() === "" || !Number.isFinite(km)) fail(`error: --margin must be a number of km, got "${value}"`);
  if (km < 0) fail(`error: --margin must not be negative, got ${value}`);
  marginKm = km;
}

const file = positional[0];
if (!file) {
  console.error(USAGE);
  process.exit(2);
}
const data = JSON.parse(readFileSync(file, "utf8")) as { vehicles: Vehicle[]; trips: Trip[] };

for (const [id, trips] of tripsByVehicle(data.trips)) {
  console.log(`${id}: ${trips.length} trips, ${drivingHours(trips)} h, ${consumptionPer100Km(trips)} l/100km`);
}
for (const { vehicle, kmLeft } of serviceDue(data.vehicles, data.trips, marginKm)) {
  console.log(`service ${kmLeft < 0 ? "OVERDUE" : "due"}: ${vehicle.id} (${kmLeft} km)`);
}
