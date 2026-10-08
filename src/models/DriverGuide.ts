import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDriverGuide extends Document {
  tenantId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
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
  employmentType: "permanent" | "freelance";
  approvalStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  documents?: {
    licenseFront?: string;
    licenseBack?: string;
    insuranceDoc?: string;
    identityCard?: string;
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
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
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
    employmentType: {
      type: String,
      enum: ["permanent", "freelance"],
      default: "permanent",
      required: true,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
      required: true,
      index: true,
    },
    rejectionReason: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    documents: {
      licenseFront: { type: String },
      licenseBack: { type: String },
      insuranceDoc: { type: String },
      identityCard: { type: String },
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
DriverGuideSchema.index({ tenantId: 1, approvalStatus: 1 });
DriverGuideSchema.index({ tenantId: 1, userId: 1 });

const DriverGuide: Model<IDriverGuide> =
  mongoose.models.DriverGuide || mongoose.model<IDriverGuide>("DriverGuide", DriverGuideSchema);

export default DriverGuide;

