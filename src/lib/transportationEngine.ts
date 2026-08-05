export interface VehicleOption {
  id: string;
  name: string;
  icon: string;
  maxPassengers: number;
  maxBaggage: number;
  perDayRateUSD: number;
  flatTripRateUSD: number;
  description: string;
}

export const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    id: "suv",
    name: "Private Luxury SUV / Sedan",
    icon: "🚗",
    maxPassengers: 4,
    maxBaggage: 3,
    perDayRateUSD: 45,
    flatTripRateUSD: 200,
    description: "Air-conditioned luxury sedan ideal for couples and small families.",
  },
  {
    id: "van",
    name: "Private High-Roof Passenger Van",
    icon: "🚐",
    maxPassengers: 8,
    maxBaggage: 8,
    perDayRateUSD: 70,
    flatTripRateUSD: 320,
    description: "Spacious van perfect for medium groups and extra luggage.",
  },
  {
    id: "bus",
    name: "Luxury Tourist Coaster Bus",
    icon: "🚌",
    maxPassengers: 20,
    maxBaggage: 20,
    perDayRateUSD: 120,
    flatTripRateUSD: 550,
    description: "Full-sized luxury tourist bus for large tour groups.",
  },
  {
    id: "train",
    name: "Scenic Ceylon Express Train + Transfer",
    icon: "🚂",
    maxPassengers: 10,
    maxBaggage: 4,
    perDayRateUSD: 35,
    flatTripRateUSD: 150,
    description: "1st Class observation train ticket + private driver transfers.",
  },
];

export function recommendVehicle(passengers: number, baggage: number): VehicleOption {
  if (passengers > 8 || baggage > 8) {
    return VEHICLE_OPTIONS.find((v) => v.id === "bus") || VEHICLE_OPTIONS[2];
  }
  if (passengers > 4 || baggage > 3) {
    return VEHICLE_OPTIONS.find((v) => v.id === "van") || VEHICLE_OPTIONS[1];
  }
  return VEHICLE_OPTIONS.find((v) => v.id === "suv") || VEHICLE_OPTIONS[0];
}

export function calculateTransportationCost(
  vehicleId: string,
  pricingModel: "per_day" | "flat_trip",
  durationDays: number
): number {
  const vehicle = VEHICLE_OPTIONS.find((v) => v.id === vehicleId) || VEHICLE_OPTIONS[0];
  if (pricingModel === "per_day") {
    return vehicle.perDayRateUSD * Math.max(1, durationDays);
  }
  return vehicle.flatTripRateUSD;
}
