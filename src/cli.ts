import { readFileSync } from "node:fs";
import { consumptionPer100Km, drivingHours, serviceDue, topVehicleByDistance, tripsByVehicle } from "./fleet.ts";
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
for (const { vehicle, kmLeft } of serviceDue(data.vehicles, data.trips)) {
  console.log(`service ${kmLeft < 0 ? "OVERDUE" : "due"}: ${vehicle.id} (${kmLeft} km)`);
}
const top = topVehicleByDistance(data.trips);
console.log(top ? `Top vehicle by distance: ${top.vehicleId} (${top.km} km).` : "Top vehicle by distance: none.");
