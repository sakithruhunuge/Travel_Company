import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Simple fallback env parser without external packages
if (!process.env.MONGODB_URI) {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const [key, ...rest] = trimmed.split("=");
          if (key && rest.length > 0 && !process.env[key.trim()]) {
            process.env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
          }
        }
      });
    }
  } catch (e) {
    console.warn("Could not read .env file:", e);
  }
}

import AttractionRate from "../src/models/AttractionRate";
import VehiclePricingPackage from "../src/models/VehiclePricingPackage";
import CurrencyExchange from "../src/models/CurrencyExchange";
import SeasonRateTier from "../src/models/SeasonRateTier";
import Tenant from "../src/models/Tenant";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/srilanka_travel";

const SEED_ATTRACTIONS = [
  {
    locationName: "Sigiriya Rock Fortress",
    city: "Sigiriya",
    category: "Heritage",
    rates: {
      localLKR: 120,
      saarcLKR: 2000, // Special bilateral rate for SAARC & Thailand
      foreignLKR: 3000, // General foreign visitor rate
      localUSD: 0.4,
      saarcUSD: 6.6,
      foreignUSD: 10.0,
      childDiscountPercent: 50,
    },
    isCustom: false,
    notes: "UNESCO World Heritage Site with ancient palace fortress, frescoes, and lion gate.",
  },
  {
    locationName: "Temple of the Tooth (Sri Dalada Maligawa)",
    city: "Kandy",
    category: "Cultural",
    rates: {
      localLKR: 0, // Free for locals
      saarcLKR: 1500,
      foreignLKR: 2000,
      localUSD: 0,
      saarcUSD: 5.0,
      foreignUSD: 6.6,
      childDiscountPercent: 50,
    },
    isCustom: false,
    notes: "Sacred tooth relic of Lord Buddha, royal palace complex.",
  },
  {
    locationName: "Dambulla Royal Cave Temple",
    city: "Dambulla",
    category: "Heritage",
    rates: {
      localLKR: 100,
      saarcLKR: 2000,
      foreignLKR: 2500,
      localUSD: 0.35,
      saarcUSD: 6.6,
      foreignUSD: 8.2,
      childDiscountPercent: 50,
    },
    isCustom: false,
    notes: "Ancient Buddhist monastery complex with 5 gilded cave temples.",
  },
  {
    locationName: "Yala National Park Safari",
    city: "Yala",
    category: "Wildlife",
    rates: {
      localLKR: 500,
      saarcLKR: 4000,
      foreignLKR: 7500,
      localUSD: 1.6,
      saarcUSD: 13.0,
      foreignUSD: 24.5,
      childDiscountPercent: 50,
    },
    isCustom: false,
    notes: "Department of Wildlife Conservation permit fees for leopard jeep safari.",
  },
  {
    locationName: "Polonnaruwa Ancient City",
    city: "Polonnaruwa",
    category: "Heritage",
    rates: {
      localLKR: 100,
      saarcLKR: 2000,
      foreignLKR: 3000,
      localUSD: 0.35,
      saarcUSD: 6.6,
      foreignUSD: 10.0,
      childDiscountPercent: 50,
    },
    isCustom: false,
    notes: "Medieval capital ruins, Gal Vihara stone statues, Parakrama Samudra.",
  },
  {
    locationName: "Horton Plains & World's End",
    city: "Nuwara Eliya",
    category: "Nature",
    rates: {
      localLKR: 400,
      saarcLKR: 3500,
      foreignLKR: 6500,
      localUSD: 1.3,
      saarcUSD: 11.5,
      foreignUSD: 21.3,
      childDiscountPercent: 50,
    },
    isCustom: false,
    notes: "Cloud forest, montane grassland, World's End sheer cliff drop.",
  },
  {
    locationName: "Pinnawala Elephant Orphanage",
    city: "Pinnawala",
    category: "Wildlife",
    rates: {
      localLKR: 200,
      saarcLKR: 2000,
      foreignLKR: 3500,
      localUSD: 0.65,
      saarcUSD: 6.6,
      foreignUSD: 11.5,
      childDiscountPercent: 50,
    },
    isCustom: false,
    notes: "Orphaned elephant herd bathing in Maha Oya river.",
  },
];

const SEED_VEHICLES = [
  {
    vehicleCategory: "Sedan",
    name: "Air-Conditioned Sedan (Toyota Prius / Axio)",
    includedKmPerDay: 100,
    dailyRateLKR: 14000,
    dailyRateUSD: 46,
    excessRatePerKmLKR: 110,
    excessRatePerKmUSD: 0.36,
    driverDailyBataLKR: 4000,
    driverDailyBataUSD: 13,
    maxPassengers: 3,
    description: "Comfortable private sedan suitable for 1-3 travelers with luggage.",
  },
  {
    vehicleCategory: "Minivan",
    name: "Tourist Minivan (Toyota KDH / HiAce Standard)",
    includedKmPerDay: 100,
    dailyRateLKR: 18000,
    dailyRateUSD: 59,
    excessRatePerKmLKR: 140,
    excessRatePerKmUSD: 0.46,
    driverDailyBataLKR: 4000,
    driverDailyBataUSD: 13,
    maxPassengers: 6,
    description: "Spacious van ideal for families or small groups of 4-6 travelers.",
  },
  {
    vehicleCategory: "High-Roof Van",
    name: "Luxury High-Roof Van (Toyota Commuter High-Roof)",
    includedKmPerDay: 100,
    dailyRateLKR: 22000,
    dailyRateUSD: 72,
    excessRatePerKmLKR: 160,
    excessRatePerKmUSD: 0.52,
    driverDailyBataLKR: 4500,
    driverDailyBataUSD: 15,
    maxPassengers: 9,
    description: "Extra headroom and luggage capacity for larger groups of 6-9 travelers.",
  },
  {
    vehicleCategory: "Mini Coach",
    name: "Tourist Mini Coach (29-Seater Rosa / Coaster)",
    includedKmPerDay: 100,
    dailyRateLKR: 32000,
    dailyRateUSD: 105,
    excessRatePerKmLKR: 220,
    excessRatePerKmUSD: 0.72,
    driverDailyBataLKR: 5000,
    driverDailyBataUSD: 16,
    maxPassengers: 20,
    description: "Medium group touring coach with panoramic windows and PA system.",
  },
  {
    vehicleCategory: "Luxury SUV",
    name: "Executive Luxury 4x4 SUV (Toyota Prado / Land Cruiser)",
    includedKmPerDay: 100,
    dailyRateLKR: 35000,
    dailyRateUSD: 115,
    excessRatePerKmLKR: 250,
    excessRatePerKmUSD: 0.82,
    driverDailyBataLKR: 5000,
    driverDailyBataUSD: 16,
    maxPassengers: 4,
    description: "VIP executive all-terrain vehicle with leather interior and premium suspension.",
  },
];

const SEED_CURRENCIES = [
  {
    baseCurrency: "USD",
    targetCurrency: "LKR",
    liveRate: 304.85,
    peggedRate: 305.0,
    usePegged: false,
    forexBufferPercent: 2.5,
    source: "CBSL",
  },
  {
    baseCurrency: "EUR",
    targetCurrency: "LKR",
    liveRate: 332.1,
    peggedRate: 332.0,
    usePegged: false,
    forexBufferPercent: 2.5,
    source: "CBSL",
  },
  {
    baseCurrency: "GBP",
    targetCurrency: "LKR",
    liveRate: 398.5,
    peggedRate: 399.0,
    usePegged: false,
    forexBufferPercent: 2.5,
    source: "CBSL",
  },
];

const SEED_SEASONS = [
  {
    name: "Winter Peak Season 2026/2027",
    seasonType: "peak",
    startDate: new Date("2026-12-15"),
    endDate: new Date("2027-01-15"),
    multiplierPercent: 125, // +25%
    description: "Christmas, New Year, and high European winter holiday surge.",
  },
  {
    name: "Summer High Season 2026",
    seasonType: "high",
    startDate: new Date("2026-07-01"),
    endDate: new Date("2026-08-31"),
    multiplierPercent: 115, // +15%
    description: "Kandy Esala Perahera and East Coast peak sunshine months.",
  },
  {
    name: "Standard Shoulder Season",
    seasonType: "shoulder",
    startDate: new Date("2026-01-16"),
    endDate: new Date("2026-04-30"),
    multiplierPercent: 100, // Baseline
    description: "Standard pleasant touring weather across cultural triangle and southern beaches.",
  },
  {
    name: "Monsoon Low Season",
    seasonType: "low",
    startDate: new Date("2026-05-01"),
    endDate: new Date("2026-06-30"),
    multiplierPercent: 90, // -10% discount
    description: "Southwest monsoon low period with discounted hotel and flight rates.",
  },
];

async function seedMasterData() {
  console.log("Connecting to MongoDB:", MONGODB_URI.replace(/:([^@]+)@/, ":****@"));
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected successfully.");

  // Fetch all tenants or use undefined for global/default
  const tenants = await Tenant.find({});
  console.log(`Found ${tenants.length} tenants in system.`);

  const tenantIds: (mongoose.Types.ObjectId | undefined)[] = [undefined];
  tenants.forEach((t) => tenantIds.push(t._id as mongoose.Types.ObjectId));

  for (const tId of tenantIds) {
    const tenantLabel = tId ? `Tenant ${tId}` : "Global Default (No Tenant)";
    console.log(`\n--- Seeding master pricing data for: ${tenantLabel} ---`);

    // 1. Seed Attractions
    for (const attr of SEED_ATTRACTIONS) {
      await (AttractionRate as any).findOneAndUpdate(
        { tenantId: tId, locationName: attr.locationName },
        { ...attr, tenantId: tId },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ Seeded ${SEED_ATTRACTIONS.length} tiered attractions.`);

    // 2. Seed Vehicles
    for (const veh of SEED_VEHICLES) {
      await (VehiclePricingPackage as any).findOneAndUpdate(
        { tenantId: tId, vehicleCategory: veh.vehicleCategory },
        { ...veh, tenantId: tId },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ Seeded ${SEED_VEHICLES.length} vehicle pricing packages.`);

    // 3. Seed Currencies
    for (const curr of SEED_CURRENCIES) {
      await (CurrencyExchange as any).findOneAndUpdate(
        { tenantId: tId, baseCurrency: curr.baseCurrency, targetCurrency: curr.targetCurrency },
        { ...curr, tenantId: tId, lastScrapedAt: new Date() },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ Seeded ${SEED_CURRENCIES.length} currency exchange pairs.`);

    // 4. Seed Seasons
    for (const season of SEED_SEASONS) {
      await (SeasonRateTier as any).findOneAndUpdate(
        { tenantId: tId, name: season.name },
        { ...season, tenantId: tId },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ Seeded ${SEED_SEASONS.length} seasonal rate brackets.`);
  }

  console.log("\nAll master pricing data seeded successfully!");
  await mongoose.disconnect();
}

seedMasterData().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
