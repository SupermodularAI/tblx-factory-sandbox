import { readFileSync } from "node:fs";
import { consumptionPer100Km, drivingHours, forVehicle, serviceDue, tripsByVehicle } from "./fleet.ts";
import type { Trip, Vehicle } from "./types.ts";

// Usage: node src/cli.ts <data.json> [--vehicle <id>]   (data: { vehicles: Vehicle[], trips: Trip[] })
const USAGE = "usage: node src/cli.ts <data.json> [--vehicle <id>]";
const args = process.argv.slice(2);
const flag = args.indexOf("--vehicle");
const vehicleId = flag === -1 ? undefined : args[flag + 1];
if (flag !== -1 && (vehicleId === undefined || vehicleId.startsWith("--"))) {
  console.error(USAGE);
  process.exit(2);
}
const file = args.find((_, i) => flag === -1 || (i !== flag && i !== flag + 1));
if (!file) {
  console.error(USAGE);
  process.exit(2);
}
const data = JSON.parse(readFileSync(file, "utf8")) as { vehicles: Vehicle[]; trips: Trip[] };

let report = data;
if (vehicleId !== undefined) {
  const scoped = forVehicle(data.vehicles, data.trips, vehicleId);
  if (!scoped) {
    console.error(`unknown vehicle: ${vehicleId}`);
    process.exit(1);
  }
  report = scoped;
}

for (const [id, trips] of tripsByVehicle(report.trips)) {
  console.log(`${id}: ${trips.length} trips, ${drivingHours(trips)} h, ${consumptionPer100Km(trips)} l/100km`);
}
for (const { vehicle, kmLeft } of serviceDue(report.vehicles, report.trips)) {
  console.log(`service ${kmLeft < 0 ? "OVERDUE" : "due"}: ${vehicle.id} (${kmLeft} km)`);
}
