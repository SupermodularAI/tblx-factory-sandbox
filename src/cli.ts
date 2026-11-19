import { readFileSync } from "node:fs";
import { co2KgByVehicle, consumptionPer100Km, drivingHours, serviceDue, tripsByVehicle } from "./fleet.ts";
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
const co2 = co2KgByVehicle(data.vehicles, data.trips);
let co2Total = 0;
for (const [id, kg] of co2) {
  console.log(`co2: ${id} ${kg} kg`);
  co2Total += kg;
}
console.log(`co2 fleet total: ${Math.round(co2Total * 100) / 100} kg`);
