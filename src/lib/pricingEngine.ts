export interface PricingInputs {
  duration: number;
  numberOfTravelers: number;
  destinations: string[];
  hotelClass: "budget" | "standard" | "luxury" | "premium-boutique";
  transportMode: "self-drive" | "private-driver" | "first-class-train" | "charter-flight";
  season: "off-peak" | "shoulder" | "peak";
  activities: string[];
  extraNights: number;
  addOns: string[];
}

export interface PricingBreakdown {
  baseCost: number;
  accommodationCost: number;
  transportCost: number;
  destinationSurcharges: number;
  activityCost: number;
  addOnsCost: number;
  subtotal: number;
  discountRate: number;
  discount: number;
  taxes: number;
  totalPrice: number;
}

export const HOTEL_RATES = {
  budget: 30, // $30 per night per traveler
  standard: 60, // $60 per night per traveler
  luxury: 120, // $120 per night per traveler
  "premium-boutique": 200, // $200 per night per traveler
};

export const HOTEL_LABELS = {
  budget: "Budget Fallback Hotel (+$30/night per traveler)",
  standard: "Standard Hotel (+$60/night per traveler)",
  luxury: "Luxury Hotel (+$120/night per traveler)",
  "premium-boutique": "Premium Boutique Villa (+$200/night per traveler)",
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

export const ADDONS_RATES = {
  breakfast: 15, // $15 per night per traveler
  dinner: 35, // $35 per night per traveler
  "airport-transfer": 40, // $40 flat per traveler
  guide: 25, // $25 per night per traveler
};

export const ADDONS_LABELS = {
  breakfast: "Daily Breakfast (+$15/night per traveler)",
  dinner: "Gourmet Dinner Buffets (+$35/night per traveler)",
  "airport-transfer": "Private Airport Pickup & Dropoff (+$40 flat/traveler)",
  guide: "Dedicated Tour Escort & Translator (+$25/night per traveler)",
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
    extraNights,
    addOns,
  } = inputs;

  const tCount = Math.max(1, numberOfTravelers);
  const baseDays = Math.max(1, duration);
  const extraN = Math.max(0, extraNights);
  const totalNights = baseDays + extraN;
  const mult = SEASON_MULTIPLIERS[season] || 1.0;

  // 1. Base Cost: $50/day per traveler * baseDays * season multiplier
  const baseCost = Math.round(50 * baseDays * tCount * mult);

  // 2. Accommodation Cost: fallback rate * totalNights * travelers * season multiplier
  const hotelRate = HOTEL_RATES[hotelClass] || 0;
  const accommodationCost = Math.round(hotelRate * totalNights * tCount * mult);

  // 3. Transport Cost: flat daily * totalNights * mult OR flat per person * travelers * mult
  const flatDaily = TRANSPORT_FLAT_DAILY[transportMode] || 0;
  const flatPerPerson = TRANSPORT_PER_PERSON_FLAT[transportMode] || 0;
  const transportCost = Math.round((flatDaily * totalNights + flatPerPerson * tCount) * mult);

  // 4. Destination surcharges (flat per traveler, no season multiplier, $80 per destination)
  let destSurchargeTotal = 0;
  destinations.forEach((dest) => {
    destSurchargeTotal += DESTINATION_SURCHARGES[dest] || 80; // default to 80 if not found
  });
  const destinationSurcharges = destSurchargeTotal * tCount;

  // 5. Activity Cost (flat per traveler)
  let actCostTotal = 0;
  activities.forEach((act) => {
    actCostTotal += ACTIVITY_RATES[act] || 0;
  });
  const activityCost = actCostTotal * tCount;

  // 6. Add-ons Cost: meals (breakfast/dinner) are calculated per night per traveler
  let addOnsTotal = 0;
  addOns.forEach((addon) => {
    if (addon === "breakfast") {
      addOnsTotal += ADDONS_RATES.breakfast * totalNights * tCount;
    } else if (addon === "dinner") {
      addOnsTotal += ADDONS_RATES.dinner * totalNights * tCount;
    } else if (addon === "airport-transfer") {
      addOnsTotal += ADDONS_RATES["airport-transfer"] * tCount;
    } else if (addon === "guide") {
      addOnsTotal += ADDONS_RATES.guide * totalNights * tCount;
    }
  });
  const addOnsCost = addOnsTotal;

  // 7. Subtotal
  const subtotal = baseCost + accommodationCost + transportCost + destinationSurcharges + activityCost + addOnsCost;

  // 8. Group Discounts (1 traveler: 0%, 2: 5%, 3-5: 10%, 6+: 15%)
  let discountRate = 0;
  if (tCount === 2) {
    discountRate = 0.05;
  } else if (tCount >= 3 && tCount <= 5) {
    discountRate = 0.10;
  } else if (tCount >= 6) {
    discountRate = 0.15;
  }
  const discount = Math.round(subtotal * discountRate);

  // 9. Taxes (12% local taxes and service charge on discounted price)
  const taxableAmount = subtotal - discount;
  const taxes = Math.round(taxableAmount * 0.12);

  // 10. Grand Total
  const totalPrice = taxableAmount + taxes;

  return {
    baseCost,
    accommodationCost,
    transportCost,
    destinationSurcharges,
    activityCost,
    addOnsCost,
    subtotal,
    discountRate,
    discount,
    taxes,
    totalPrice,
  };
}
