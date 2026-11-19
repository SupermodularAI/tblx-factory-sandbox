import { test } from "node:test";
import assert from "node:assert/strict";
import { co2KgByVehicle, consumptionPer100Km, drivingHours, kmToService, latestOdometer, serviceDue, tripsByVehicle } from "../src/fleet.ts";
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

test("co2 per vehicle uses the fuel type's factor", () => {
  const vehicles = [vehicle({ id: "D", fuelType: "diesel" }), vehicle({ id: "P", fuelType: "petrol" }), vehicle({ id: "E", fuelType: "electric" })];
  const trips = [trip({ vehicleId: "D" }), trip({ vehicleId: "P" }), trip({ vehicleId: "E", fuelLitres: 0 }), trip({ vehicleId: "D", fuelLitres: 10 })];
  const co2 = co2KgByVehicle(vehicles, trips);
  assert.equal(co2.get("D"), 107.2);
  assert.equal(co2.get("P"), 69.3);
  assert.equal(co2.get("E"), 0);
});

test("co2 counts a vehicle without a fuel type as diesel", () => {
  assert.equal(co2KgByVehicle([vehicle()], [trip()]).get("V1"), 80.4);
});

test("co2 is 0 for a vehicle with no trips", () => {
  const co2 = co2KgByVehicle([vehicle({ fuelType: "petrol" })], []);
  assert.equal(co2.size, 1);
  assert.equal(co2.get("V1"), 0);
});

test("co2 is rounded to 2 decimals", () => {
  assert.equal(co2KgByVehicle([vehicle()], [trip({ fuelLitres: 10.123 })]).get("V1"), 27.13);
});

test("co2 ignores trips of vehicles not in the list", () => {
  const co2 = co2KgByVehicle([vehicle()], [trip(), trip({ vehicleId: "V9" })]);
  assert.equal(co2.size, 1);
  assert.equal(co2.get("V1"), 80.4);
});
