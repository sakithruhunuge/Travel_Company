import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHotelContractRate extends Document {
  tenantId?: mongoose.Types.ObjectId;
  hotelName: string;
  city: string;
  roomCategory: "Standard" | "Deluxe" | "Superior" | "Suite" | "Villa";
  mealPlan: "RO" | "BB" | "HB" | "FB" | "AI"; // Room Only, Bed & Breakfast, Half Board, Full Board, All Inclusive
  seasonType: "peak" | "high" | "shoulder" | "low";
  validFrom: Date;
  validTo: Date;
  netRateLKR: number;
  netRateUSD: number;
  marketTiers: string[]; // e.g. ["SAARC", "WESTERN_EUROPE", "ALL"]
  fallbackScrapedRateUSD?: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HotelContractRateSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: false, index: true },
    hotelName: { type: String, required: true },
    city: { type: String, required: true, index: true },
    roomCategory: {
      type: String,
      enum: ["Standard", "Deluxe", "Superior", "Suite", "Villa"],
      default: "Standard",
      required: true,
    },
    mealPlan: {
      type: String,
      enum: ["RO", "BB", "HB", "FB", "AI"],
      default: "BB",
      required: true,
    },
    seasonType: {
      type: String,
      enum: ["peak", "high", "shoulder", "low"],
      default: "shoulder",
      required: true,
    },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    netRateLKR: { type: Number, required: true, default: 0 },
    netRateUSD: { type: Number, required: true, default: 0 },
    marketTiers: { type: [String], default: ["ALL"] },
    fallbackScrapedRateUSD: { type: Number },
    notes: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

HotelContractRateSchema.index({ tenantId: 1, city: 1, hotelName: 1 });
HotelContractRateSchema.index({ tenantId: 1, validFrom: 1, validTo: 1 });

const HotelContractRate: Model<IHotelContractRate> =
  mongoose.models.HotelContractRate ||
  mongoose.model<IHotelContractRate>("HotelContractRate", HotelContractRateSchema);

export default HotelContractRate;
