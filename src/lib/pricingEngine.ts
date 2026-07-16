export interface PricingInputs {
  duration: number;
  numberOfTravelers: number;
  destinations: string[];
  hotelClass: "budget" | "standard" | "luxury" | "premium-boutique";
  transportMode: "self-drive" | "private-driver" | "first-class-train" | "charter-flight";
  season: "off-peak" | "shoulder" | "peak";
  activities: string[];
}

export interface PricingBreakdown {
  baseCost: number;
  accommodationCost: number;
  transportCost: number;
  destinationSurcharges: number;
  activityCost: number;
  subtotal: number;
  discountRate: number;
  discount: number;
  taxes: number;
  totalPrice: number;
}

export const HOTEL_RATES = {
  budget: 20,
  standard: 50,
  luxury: 120,
  "premium-boutique": 200,
};

export const HOTEL_LABELS = {
  budget: "Budget (+$20/day per traveler)",
  standard: "Standard (+$50/day per traveler)",
  luxury: "Luxury (+$120/day per traveler)",
  "premium-boutique": "Premium Boutique (+$200/day per traveler)",
};

export const TRANSPORT_FLAT_DAILY = {
  "self-drive": 30,
  "private-driver": 75,
  "first-class-train": 0,
  "charter-flight": 0,
};

export const TRANSPORT_PER_PERSON_FLAT = {
  "self-drive": 0,
  "private-driver": 0,
  "first-class-train": 20,
  "charter-flight": 500,
};

export const TRANSPORT_LABELS = {
  "self-drive": "Self-Drive Car (+$30/day flat)",
  "private-driver": "Private Car & Local Driver (+$75/day flat)",
  "first-class-train": "First Class Observation Rail (+$20/traveler)",
  "charter-flight": "Helicopter / Charter Flight (+$500/traveler)",
};

export const DESTINATION_SURCHARGES: Record<string, number> = {
  Sigiriya: 80,
  Galle: 80,
  "Nuwara Eliya": 80,
  Colombo: 40,
  Bentota: 40,
  Mirissa: 40,
  Kandy: 40,
  Yala: 60,
  Dambulla: 60,
  Ella: 60,
};

export const SEASON_MULTIPLIERS = {
  "off-peak": 0.85,
  shoulder: 1.05,
  peak: 1.25,
};

export const SEASON_LABELS = {
  "off-peak": "Off-Peak Season (0.85x Multiplier)",
  shoulder: "Shoulder Season (1.05x Multiplier)",
  peak: "Peak Season (1.25x Multiplier)",
};

export const ACTIVITY_RATES: Record<string, number> = {
  "yala-safari": 60,
  "surf-lessons": 40,
  "sigiriya-hike": 30,
  "cooking-class": 25,
};

export const ACTIVITY_LABELS = {
  "yala-safari": "Yala Wildlife Jeep Safari (+$60/traveler)",
  "surf-lessons": "Weligama Bay Surf Lesson (+$40/traveler)",
  "sigiriya-hike": "Guided Sunset Climb of Sigiriya (+$30/traveler)",
  "cooking-class": "Traditional Sri Lankan Cooking Class (+$25/traveler)",
};

/**
 * Computes detailed pricing metrics based on travelers, destinations, hotel, transport, and season.
 */
export function calculateTripPricing(inputs: PricingInputs): PricingBreakdown {
  const {
    duration,
    numberOfTravelers,
    destinations,
    hotelClass,
    transportMode,
    season,
    activities,
  } = inputs;

  const tCount = Math.max(1, numberOfTravelers);
  const days = Math.max(1, duration);
  const mult = SEASON_MULTIPLIERS[season] || 1.0;

  // 1. Base Cost: $50/day per traveler * season multiplier
  const baseCost = Math.round(50 * days * tCount * mult);

  // 2. Accommodation Cost: rate * days * travelers * season multiplier
  const hotelRate = HOTEL_RATES[hotelClass] || 0;
  const accommodationCost = Math.round(hotelRate * days * tCount * mult);

  // 3. Transport Cost: flat daily * days * mult OR flat per person * travelers * mult
  const flatDaily = TRANSPORT_FLAT_DAILY[transportMode] || 0;
  const flatPerPerson = TRANSPORT_PER_PERSON_FLAT[transportMode] || 0;
  const transportCost = Math.round((flatDaily * days + flatPerPerson * tCount) * mult);

  // 4. Destination surcharges (flat per traveler, no season multiplier)
  let destSurchargeTotal = 0;
  destinations.forEach((dest) => {
    destSurchargeTotal += DESTINATION_SURCHARGES[dest] || 0;
  });
  const destinationSurcharges = destSurchargeTotal * tCount;

  // 5. Activity Cost (flat per traveler)
  let actCostTotal = 0;
  activities.forEach((act) => {
    actCostTotal += ACTIVITY_RATES[act] || 0;
  });
  const activityCost = actCostTotal * tCount;

  // 6. Subtotal
  const subtotal = baseCost + accommodationCost + transportCost + destinationSurcharges + activityCost;

  // 7. Group Discounts (1 traveler: 0%, 2: 5%, 3-5: 10%, 6+: 15%)
  let discountRate = 0;
  if (tCount === 2) {
    discountRate = 0.05;
  } else if (tCount >= 3 && tCount <= 5) {
    discountRate = 0.10;
  } else if (tCount >= 6) {
    discountRate = 0.15;
  }
  const discount = Math.round(subtotal * discountRate);

  // 8. Taxes (12% local taxes and service charge on discounted price)
  const taxableAmount = subtotal - discount;
  const taxes = Math.round(taxableAmount * 0.12);

  // 9. Grand Total
  const totalPrice = taxableAmount + taxes;

  return {
    baseCost,
    accommodationCost,
    transportCost,
    destinationSurcharges,
    activityCost,
    subtotal,
    discountRate,
    discount,
    taxes,
    totalPrice,
  };
}
