import type { Trip, Vehicle } from "./types.ts";

/** Fuel consumption in litres per 100 km over the given trips; 0 when no distance was driven. */
export function consumptionPer100Km(trips: Trip[]): number {
  const distance = trips.reduce((sum, t) => sum + t.distanceKm, 0);
  const fuel = trips.reduce((sum, t) => sum + t.fuelLitres, 0);
  if (distance === 0) return 0;
  return round((fuel / distance) * 100, 2);
}

/** Total driving time in hours. */
export function drivingHours(trips: Trip[]): number {
  const ms = trips.reduce((sum, t) => sum + (Date.parse(t.endedAt) - Date.parse(t.startedAt)), 0);
  return round(ms / 3_600_000, 2);
}

/** Groups trips by vehicle id. */
export function tripsByVehicle(trips: Trip[]): Map<string, Trip[]> {
  const out = new Map<string, Trip[]>();
  for (const trip of trips) {
    const list = out.get(trip.vehicleId) ?? [];
    list.push(trip);
    out.set(trip.vehicleId, list);
  }
  return out;
}

/** Trip length categories from TLS-12, in report order. */
export const TRIP_LENGTH_CATEGORIES = ["short", "regional", "long-haul"] as const;
export type TripLengthCategory = (typeof TRIP_LENGTH_CATEGORIES)[number];

/** Category of a trip by distance (TLS-12): short < 15 km, regional 15–120 km inclusive, long-haul > 120 km. */
export function tripLengthCategory(trip: Trip): TripLengthCategory {
  if (trip.distanceKm < 15) return "short";
  if (trip.distanceKm <= 120) return "regional";
  return "long-haul";
}

/** Number of trips in each length category per vehicle id; every category present, vehicles without trips absent. */
export function tripCountsByCategory(trips: Trip[]): Map<string, Record<TripLengthCategory, number>> {
  const out = new Map<string, Record<TripLengthCategory, number>>();
  for (const trip of trips) {
    const counts = out.get(trip.vehicleId) ?? { short: 0, regional: 0, "long-haul": 0 };
    counts[tripLengthCategory(trip)]++;
    out.set(trip.vehicleId, counts);
  }
  return out;
}

/** Latest odometer reading seen for a vehicle, or undefined when it has no trips. */
export function latestOdometer(trips: Trip[], vehicleId: string): number | undefined {
  let latest: number | undefined;
  for (const trip of trips) {
    if (trip.vehicleId !== vehicleId) continue;
    if (latest === undefined || trip.odometerKm > latest) latest = trip.odometerKm;
  }
  return latest;
}

/** Km left until the next service; negative when the service is overdue. */
export function kmToService(vehicle: Vehicle, odometerKm: number): number {
  return vehicle.lastServiceKm + vehicle.serviceIntervalKm - odometerKm;
}

/** Vehicles whose next service is due within `marginKm`, most urgent first. */
export function serviceDue(vehicles: Vehicle[], trips: Trip[], marginKm = 1000): Array<{ vehicle: Vehicle; kmLeft: number }> {
  const due: Array<{ vehicle: Vehicle; kmLeft: number }> = [];
  for (const vehicle of vehicles) {
    const odometer = latestOdometer(trips, vehicle.id);
    if (odometer === undefined) continue;
    const kmLeft = kmToService(vehicle, odometer);
    if (kmLeft <= marginKm) due.push({ vehicle, kmLeft });
  }
  return due.sort((a, b) => a.kmLeft - b.kmLeft);
}

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
