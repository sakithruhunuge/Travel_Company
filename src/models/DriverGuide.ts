import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDriverGuide extends Document {
  tenantId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  role: "driver" | "tour_guide" | "both";
  licenseNumber: string;
  languages: string[]; // e.g. ["English", "German", "French", "Mandarin"]
  vehicleDetails?: {
    category: string; // "Sedan", "Van", "Mini Coach", "SUV"
    plateNumber: string;
    model: string;
    capacity: number;
  };
  rating: number; // e.g. 4.8
  status: "available" | "on_tour" | "off_duty";
  activeToursCount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DriverGuideSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: false },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    role: {
      type: String,
      enum: ["driver", "tour_guide", "both"],
      required: true,
      default: "driver",
    },
    licenseNumber: { type: String, required: true },
    languages: { type: [String], default: ["English"] },
    vehicleDetails: {
      category: { type: String },
      plateNumber: { type: String },
      model: { type: String },
      capacity: { type: Number, default: 4 },
    },
    rating: { type: Number, default: 5.0, min: 1, max: 5 },
    status: {
      type: String,
      enum: ["available", "on_tour", "off_duty"],
      default: "available",
      required: true,
    },
    activeToursCount: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

DriverGuideSchema.index({ tenantId: 1, role: 1 });
DriverGuideSchema.index({ tenantId: 1, status: 1 });
DriverGuideSchema.index({ tenantId: 1, email: 1 });

const DriverGuide: Model<IDriverGuide> =
  mongoose.models.DriverGuide || mongoose.model<IDriverGuide>("DriverGuide", DriverGuideSchema);

export default DriverGuide;
