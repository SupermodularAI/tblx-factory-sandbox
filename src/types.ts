export interface Vehicle {
  id: string;
  model: string;
  /** Odometer reading at the last service, in km. */
  lastServiceKm: number;
  /** Service interval for this model, in km. */
  serviceIntervalKm: number;
}

export interface Trip {
  vehicleId: string;
  /** ISO 8601 start time. */
  startedAt: string;
  /** ISO 8601 end time. */
  endedAt: string;
  distanceKm: number;
  fuelLitres: number;
  /** Odometer reading at the end of the trip, in km. */
  odometerKm: number;
  /** Id of the driver who drove the trip, when recorded. */
  driverId?: string;
}
