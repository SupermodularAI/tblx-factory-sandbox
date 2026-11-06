import { readFileSync } from "node:fs";
import { FleetDataError, parseTrips, parseVehicles } from "fleet-api";
import { consumptionPer100Km, drivingHours, serviceDue, tripsByVehicle } from "./fleet.ts";

// Usage: node src/cli.ts <data.json>   (data: { vehicles: Vehicle[], trips: Trip[] })
const file = process.argv[2];
if (!file) {
  console.error("usage: node src/cli.ts <data.json>");
  process.exit(2);
}
let data;
try {
  const raw = JSON.parse(readFileSync(file, "utf8")) as { vehicles?: unknown; trips?: unknown };
  data = { vehicles: parseVehicles(raw.vehicles), trips: parseTrips(raw.trips) };
} catch (err) {
  if (!(err instanceof FleetDataError) && !(err instanceof SyntaxError)) throw err;
  console.error(`${file}: ${err.message}`);
  process.exit(1);
}

for (const [id, trips] of tripsByVehicle(data.trips)) {
  console.log(`${id}: ${trips.length} trips, ${drivingHours(trips)} h, ${consumptionPer100Km(trips)} l/100km`);
}
for (const { vehicle, kmLeft } of serviceDue(data.vehicles, data.trips)) {
  console.log(`service ${kmLeft < 0 ? "OVERDUE" : "due"}: ${vehicle.id} (${kmLeft} km)`);
}
