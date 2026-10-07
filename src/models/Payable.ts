import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayable extends Document {
  tenantId?: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  tourId?: mongoose.Types.ObjectId; // Reference to TravelRequest/Tour
  description?: string;
  amountTotal: number;
  amountPaid: number;
  balanceDue: number; // Important for $inc operations
  dueDate?: Date;
  status: "pending" | "partially_paid" | "settled" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const PayableSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: false },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    tourId: { type: Schema.Types.ObjectId, ref: "TravelRequest" },
    description: { type: String },
    amountTotal: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    balanceDue: { type: Number, required: true, min: 0 },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ["pending", "partially_paid", "settled", "cancelled"],
      default: "pending",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

PayableSchema.index({ tenantId: 1, vendorId: 1 });
PayableSchema.index({ tenantId: 1, status: 1 });
PayableSchema.index({ tenantId: 1, tourId: 1 });

const Payable: Model<IPayable> =
  mongoose.models.Payable || mongoose.model<IPayable>("Payable", PayableSchema);

export default Payable;
