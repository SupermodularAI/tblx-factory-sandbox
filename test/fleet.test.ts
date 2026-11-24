import { test } from "node:test";
import assert from "node:assert/strict";
import { consumptionPer100Km, drivingHours, kmToService, latestOdometer, serviceDue, tripCountsByCategory, tripLengthCategory, tripsByVehicle } from "../src/fleet.ts";
import type { Trip, Vehicle } from "../src/types.ts";

const trip = (over: Partial<Trip> = {}): Trip => ({
  vehicleId: "V1",
  startedAt: "2026-10-01T08:00:00Z",
  endedAt: "2026-10-01T10:00:00Z",
  distanceKm: 100,
  fuelLitres: 30,
  odometerKm: 1000,
  ...over,
});
const vehicle = (over: Partial<Vehicle> = {}): Vehicle => ({ id: "V1", model: "Actros", lastServiceKm: 0, serviceIntervalKm: 1500, ...over });

test("consumption is litres per 100 km across trips", () => {
  assert.equal(consumptionPer100Km([trip(), trip({ distanceKm: 300, fuelLitres: 60 })]), 22.5);
});

test("consumption is 0 with no distance", () => {
  assert.equal(consumptionPer100Km([]), 0);
});

test("driving hours sums trip durations", () => {
  assert.equal(drivingHours([trip(), trip({ endedAt: "2026-10-01T08:30:00Z" })]), 2.5);
});

test("trips are grouped by vehicle", () => {
  const groups = tripsByVehicle([trip(), trip({ vehicleId: "V2" }), trip()]);
  assert.equal(groups.get("V1")?.length, 2);
  assert.equal(groups.get("V2")?.length, 1);
});

test("latest odometer is the highest reading for the vehicle", () => {
  assert.equal(latestOdometer([trip({ odometerKm: 900 }), trip({ odometerKm: 1200 }), trip({ vehicleId: "V2", odometerKm: 5000 })], "V1"), 1200);
  assert.equal(latestOdometer([], "V1"), undefined);
});

test("km to service is negative when overdue", () => {
  assert.equal(kmToService(vehicle(), 1000), 500);
  assert.equal(kmToService(vehicle(), 1600), -100);
});

test("service due lists vehicles within the margin, most urgent first", () => {
  const vehicles = [vehicle(), vehicle({ id: "V2", serviceIntervalKm: 10_000 }), vehicle({ id: "V3", serviceIntervalKm: 1100 })];
  const trips = [trip(), trip({ vehicleId: "V2" }), trip({ vehicleId: "V3" })];
  assert.deepEqual(serviceDue(vehicles, trips).map((d) => [d.vehicle.id, d.kmLeft]), [["V3", 100], ["V1", 500]]);
});

test("trip length category: one trip in each category", () => {
  assert.equal(tripLengthCategory(trip({ distanceKm: 5 })), "short");
  assert.equal(tripLengthCategory(trip({ distanceKm: 60 })), "regional");
  assert.equal(tripLengthCategory(trip({ distanceKm: 300 })), "long-haul");
});

test("trip length category: trips on and around each limit", () => {
  assert.equal(tripLengthCategory(trip({ distanceKm: 14.9 })), "short");
  assert.equal(tripLengthCategory(trip({ distanceKm: 15 })), "regional");
  assert.equal(tripLengthCategory(trip({ distanceKm: 120 })), "regional");
  assert.equal(tripLengthCategory(trip({ distanceKm: 120.1 })), "long-haul");
});

test("trip counts by category per vehicle, with zeros", () => {
  const trips = [trip({ distanceKm: 10 }), trip({ distanceKm: 15 }), trip({ distanceKm: 120 }), trip({ vehicleId: "V2", distanceKm: 121 })];
  assert.deepEqual(
    tripCountsByCategory(trips),
    new Map([
      ["V1", { short: 1, regional: 2, "long-haul": 0 }],
      ["V2", { short: 0, regional: 0, "long-haul": 1 }],
    ]),
  );
});

test("trip counts by category is empty for no trips", () => {
  assert.equal(tripCountsByCategory([]).size, 0);
});

test("category counts keep TLS-12 order", () => {
  assert.deepEqual(Object.keys(tripCountsByCategory([trip()]).get("V1")!), ["short", "regional", "long-haul"]);
});
