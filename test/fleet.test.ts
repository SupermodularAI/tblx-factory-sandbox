import { test } from "node:test";
import assert from "node:assert/strict";
import { averageIdleHours, consumptionPer100Km, drivingHours, kmToService, latestOdometer, serviceDue, tripsByVehicle } from "../src/fleet.ts";
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

const at = (time: string): string => `2026-10-01T${time}:00Z`;
const span = (start: string, end: string, over: Partial<Trip> = {}): Trip => trip({ startedAt: at(start), endedAt: at(end), ...over });

test("average idle hours is the mean gap between consecutive trips", () => {
  const trips = [span("08:00", "10:00"), span("12:00", "13:00"), span("17:00", "18:00")];
  assert.equal(averageIdleHours(trips, "V1"), 3);
});

test("average idle hours is 0 for a single trip", () => {
  assert.equal(averageIdleHours([trip()], "V1"), 0);
});

test("average idle hours is 0 with no trips", () => {
  assert.equal(averageIdleHours([], "V1"), 0);
  assert.equal(averageIdleHours([trip({ vehicleId: "V2" })], "V1"), 0);
});

test("average idle hours orders trips by start time", () => {
  const trips = [span("17:00", "18:00"), span("08:00", "10:00"), span("12:00", "13:00")];
  assert.equal(averageIdleHours(trips, "V1"), 3);
});

test("average idle hours only counts the given vehicle", () => {
  const trips = [span("08:00", "10:00"), span("11:00", "12:00", { vehicleId: "V2" }), span("14:00", "15:00")];
  assert.equal(averageIdleHours(trips, "V1"), 4);
});

test("average idle hours rounds to 2 decimals", () => {
  const trips = [span("08:00", "10:00"), span("10:20", "11:00"), span("11:00", "12:00")];
  assert.equal(averageIdleHours(trips, "V1"), 0.17);
});
