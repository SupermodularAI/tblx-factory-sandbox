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

const UNASSIGNED = "unassigned";

/** Driving hours per driver id, sorted by id; trips without a driver are grouped under "unassigned", listed last. */
export function drivingHoursByDriver(trips: Trip[]): Map<string, number> {
  const groups = new Map<string, Trip[]>();
  for (const trip of trips) {
    const id = trip.driverId ?? UNASSIGNED;
    const list = groups.get(id) ?? [];
    list.push(trip);
    groups.set(id, list);
  }
  const ids = [...groups.keys()].sort((a, b) => (a === UNASSIGNED ? 1 : b === UNASSIGNED ? -1 : a < b ? -1 : a > b ? 1 : 0));
  return new Map(ids.map((id) => [id, drivingHours(groups.get(id)!)]));
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
