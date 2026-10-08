import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVehiclePricingPackage extends Document {
  tenantId?: mongoose.Types.ObjectId;
  vehicleCategory: "Sedan" | "Minivan" | "High-Roof Van" | "Mini Coach" | "Large Coach" | "Luxury SUV";
  name: string; // e.g. "Standard Sedan Day Package", "Van Roundtrip Package"
  includedKmPerDay: number; // e.g. 100 km per day
  dailyRateLKR: number; // e.g. 14,000 LKR
  dailyRateUSD: number; // e.g. 46 USD
  excessRatePerKmLKR: number; // e.g. 110 LKR per km
  excessRatePerKmUSD: number; // e.g. 0.36 USD
  driverDailyBataLKR: number; // e.g. 4,000 LKR (driver food & night stay)
  driverDailyBataUSD: number; // e.g. 13 USD
  maxPassengers: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VehiclePricingPackageSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: false, index: true },
    vehicleCategory: {
      type: String,
      enum: ["Sedan", "Minivan", "High-Roof Van", "Mini Coach", "Large Coach", "Luxury SUV"],
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    includedKmPerDay: { type: Number, required: true, default: 100 },
    dailyRateLKR: { type: Number, required: true, default: 0 },
    dailyRateUSD: { type: Number, required: true, default: 0 },
    excessRatePerKmLKR: { type: Number, required: true, default: 0 },
    excessRatePerKmUSD: { type: Number, required: true, default: 0 },
    driverDailyBataLKR: { type: Number, required: true, default: 4000 },
    driverDailyBataUSD: { type: Number, required: true, default: 13 },
    maxPassengers: { type: Number, required: true, default: 4 },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

VehiclePricingPackageSchema.index({ tenantId: 1, vehicleCategory: 1, isActive: 1 });

const VehiclePricingPackage: Model<IVehiclePricingPackage> =
  mongoose.models.VehiclePricingPackage ||
  mongoose.model<IVehiclePricingPackage>("VehiclePricingPackage", VehiclePricingPackageSchema);

export default VehiclePricingPackage;
