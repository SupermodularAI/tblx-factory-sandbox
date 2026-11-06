import { readFileSync } from "node:fs";
import { consumptionPer100Km, drivingHours, serviceDue, tripsByVehicle } from "./fleet.ts";
import type { Trip, Vehicle } from "./types.ts";

// Usage: node src/cli.ts <data.json> [--margin <km>]   (data: { vehicles: Vehicle[], trips: Trip[] })
const args = process.argv.slice(2);
let marginKm: number | undefined;
const marginAt = args.indexOf("--margin");
if (marginAt !== -1) {
  const raw = args[marginAt + 1];
  if (raw === undefined || !/^\d+(\.\d+)?$/.test(raw)) {
    console.error(`error: --margin must be a non-negative number of km, got ${JSON.stringify(raw ?? "")}`);
    process.exit(2);
  }
  marginKm = Number(raw);
  args.splice(marginAt, 2);
}
const file = args[0];
if (!file) {
  console.error("usage: node src/cli.ts <data.json> [--margin <km>]");
  process.exit(2);
}
const data = JSON.parse(readFileSync(file, "utf8")) as { vehicles: Vehicle[]; trips: Trip[] };

for (const [id, trips] of tripsByVehicle(data.trips)) {
  console.log(`${id}: ${trips.length} trips, ${drivingHours(trips)} h, ${consumptionPer100Km(trips)} l/100km`);
}
for (const { vehicle, kmLeft } of serviceDue(data.vehicles, data.trips, marginKm)) {
  console.log(`service ${kmLeft < 0 ? "OVERDUE" : "due"}: ${vehicle.id} (${kmLeft} km)`);
}
