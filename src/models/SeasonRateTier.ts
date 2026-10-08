import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISeasonRateTier extends Document {
  tenantId?: mongoose.Types.ObjectId;
  name: string; // e.g. "Winter Peak", "Kandy Perahera Festive", "Summer Shoulder", "Monsoon Low"
  seasonType: "peak" | "high" | "shoulder" | "low" | "festive_surge";
  startDate: Date;
  endDate: Date;
  multiplierPercent: number; // e.g. 120 for +20% or 100 for normal baseline
  marketRegions?: string[]; // e.g. ["SAARC", "WESTERN_EUROPE", "DOMESTIC", "ALL"]
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SeasonRateTierSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: false, index: true },
    name: { type: String, required: true },
    seasonType: {
      type: String,
      enum: ["peak", "high", "shoulder", "low", "festive_surge"],
      required: true,
      default: "shoulder",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    multiplierPercent: { type: Number, required: true, default: 100 },
    marketRegions: { type: [String], default: ["ALL"] },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

SeasonRateTierSchema.index({ tenantId: 1, seasonType: 1 });
SeasonRateTierSchema.index({ tenantId: 1, startDate: 1, endDate: 1 });

const SeasonRateTier: Model<ISeasonRateTier> =
  mongoose.models.SeasonRateTier ||
  mongoose.model<ISeasonRateTier>("SeasonRateTier", SeasonRateTierSchema);

export default SeasonRateTier;
