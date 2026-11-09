import { readFileSync } from "node:fs";
import { consumptionPer100Km, drivingHours, drivingHoursByDriver, serviceDue, tripsByVehicle } from "./fleet.ts";
import type { Trip, Vehicle } from "./types.ts";

// Usage: node src/cli.ts <data.json>   (data: { vehicles: Vehicle[], trips: Trip[] })
const file = process.argv[2];
if (!file) {
  console.error("usage: node src/cli.ts <data.json>");
  process.exit(2);
}
const data = JSON.parse(readFileSync(file, "utf8")) as { vehicles: Vehicle[]; trips: Trip[] };

for (const [id, trips] of tripsByVehicle(data.trips)) {
  console.log(`${id}: ${trips.length} trips, ${drivingHours(trips)} h, ${consumptionPer100Km(trips)} l/100km`);
}
if (data.trips.some((t) => t.driverId !== undefined)) {
  for (const [driver, hours] of drivingHoursByDriver(data.trips)) {
    console.log(`driver ${driver}: ${hours} h`);
  }
}
for (const { vehicle, kmLeft } of serviceDue(data.vehicles, data.trips)) {
  console.log(`service ${kmLeft < 0 ? "OVERDUE" : "due"}: ${vehicle.id} (${kmLeft} km)`);
}
