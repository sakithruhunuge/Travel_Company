import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAttractionRate extends Document {
  tenantId?: mongoose.Types.ObjectId;
  locationName: string;
  city: string;
  category: "Heritage" | "Wildlife" | "Cultural" | "Nature" | "Adventure" | "Other";
  rates: {
    localLKR: number;
    saarcLKR: number; // Applied to SAARC nations and Thailand (~2000 LKR)
    foreignLKR: number; // Applied to other foreign countries (~3000 LKR)
    localUSD?: number;
    saarcUSD?: number;
    foreignUSD?: number;
    childDiscountPercent: number; // e.g. 50%
  };
  isCustom: boolean; // True if added ad-hoc as "Other"
  createdOnTheFlyForTourId?: string;
  scrapedSourceUrl?: string;
  lastVerifiedAt?: Date;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttractionRateSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: false, index: true },
    locationName: { type: String, required: true },
    city: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: ["Heritage", "Wildlife", "Cultural", "Nature", "Adventure", "Other"],
      default: "Heritage",
      required: true,
    },
    rates: {
      localLKR: { type: Number, required: true, default: 100 },
      saarcLKR: { type: Number, required: true, default: 2000 },
      foreignLKR: { type: Number, required: true, default: 3000 },
      localUSD: { type: Number, default: 0.35 },
      saarcUSD: { type: Number, default: 6.5 },
      foreignUSD: { type: Number, default: 10.0 },
      childDiscountPercent: { type: Number, default: 50 },
    },
    isCustom: { type: Boolean, default: false },
    createdOnTheFlyForTourId: { type: String },
    scrapedSourceUrl: { type: String },
    lastVerifiedAt: { type: Date },
    notes: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

AttractionRateSchema.index({ tenantId: 1, locationName: 1 });
AttractionRateSchema.index({ tenantId: 1, city: 1 });

const AttractionRate: Model<IAttractionRate> =
  mongoose.models.AttractionRate ||
  mongoose.model<IAttractionRate>("AttractionRate", AttractionRateSchema);

export default AttractionRate;
