import { test } from "node:test";
import assert from "node:assert/strict";
import { consumptionPer100Km, distanceByVehicle, drivingHours, kmToService, latestOdometer, serviceDue, topVehicleByDistance, tripsByVehicle } from "../src/fleet.ts";
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

test("distance is summed per vehicle", () => {
  const result = distanceByVehicle([trip(), trip({ vehicleId: "V2", distanceKm: 50 }), trip({ distanceKm: 25.5 })]);
  assert.deepEqual(result, new Map([["V1", 125.5], ["V2", 50]]));
});

test("distance per vehicle is rounded to 2 decimals", () => {
  assert.equal(distanceByVehicle([trip({ distanceKm: 0.1 }), trip({ distanceKm: 0.2 })]).get("V1"), 0.3);
});

test("distance per vehicle is empty with no trips", () => {
  const result = distanceByVehicle([]);
  assert.ok(result instanceof Map);
  assert.equal(result.size, 0);
});

test("top vehicle is the one with the most distance", () => {
  assert.deepEqual(topVehicleByDistance([trip(), trip({ vehicleId: "V2", distanceKm: 150 }), trip({ distanceKm: 30 })]), { vehicleId: "V2", km: 150 });
});

test("top vehicle tie goes to the first vehicle seen", () => {
  assert.deepEqual(topVehicleByDistance([trip({ vehicleId: "V2" }), trip()]), { vehicleId: "V2", km: 100 });
});

test("top vehicle is undefined with no trips", () => {
  assert.equal(topVehicleByDistance([]), undefined);
});
