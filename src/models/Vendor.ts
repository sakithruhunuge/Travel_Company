import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVendor extends Document {
  tenantId?: mongoose.Types.ObjectId;
  name: string;
  type: "hotel" | "transport" | "attraction" | "other";
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: false },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["hotel", "transport", "attraction", "other"],
      required: true,
    },
    contactPerson: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
  },
  {
    timestamps: true,
  }
);

VendorSchema.index({ tenantId: 1, name: 1 });
VendorSchema.index({ tenantId: 1, type: 1 });

const Vendor: Model<IVendor> =
  mongoose.models.Vendor || mongoose.model<IVendor>("Vendor", VendorSchema);

export default Vendor;
