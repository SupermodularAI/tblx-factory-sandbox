import { readFileSync } from "node:fs";
import { consumptionPer100Km, drivingHours, serviceDue, tripsByVehicle } from "./fleet.ts";
import type { Trip, Vehicle } from "./types.ts";

// Usage: node src/cli.ts [--margin <km>] <data.json>   (data: { vehicles: Vehicle[], trips: Trip[] })
const usage = "usage: node src/cli.ts [--margin <km>] <data.json>";
let file: string | undefined;
let marginKm: number | undefined;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--margin") {
    const value = args[++i];
    const km = value === undefined || value.trim() === "" ? NaN : Number(value);
    if (!Number.isFinite(km) || km < 0) {
      console.error(value === undefined ? "error: --margin needs a value in km" : `error: --margin must be a non-negative number of km, got "${value}"`);
      console.error(usage);
      process.exit(2);
    }
    marginKm = km;
  } else if (file === undefined) {
    file = args[i];
  }
}
if (!file) {
  console.error(usage);
  process.exit(2);
}
const data = JSON.parse(readFileSync(file, "utf8")) as { vehicles: Vehicle[]; trips: Trip[] };

for (const [id, trips] of tripsByVehicle(data.trips)) {
  console.log(`${id}: ${trips.length} trips, ${drivingHours(trips)} h, ${consumptionPer100Km(trips)} l/100km`);
}
for (const { vehicle, kmLeft } of serviceDue(data.vehicles, data.trips, marginKm)) {
  console.log(`service ${kmLeft < 0 ? "OVERDUE" : "due"}: ${vehicle.id} (${kmLeft} km)`);
}
