import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  tenantId?: mongoose.Types.ObjectId;
  transactionType: "inbound" | "outbound"; // Inbound = Debtors (Client), Outbound = Creditors (Vendor)
  referenceType: "TravelRequest" | "Payable"; 
  referenceId: mongoose.Types.ObjectId;
  vendorId?: mongoose.Types.ObjectId; // Only applicable for outbound
  amount: number;
  paymentMethod: "cash" | "bank_transfer" | "card" | "other";
  currency: string;
  paymentDate: Date;
  notes?: string;
  recordedBy?: string; // Optional: user ID who recorded it
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: false },
    transactionType: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
    },
    referenceType: {
      type: String,
      enum: ["TravelRequest", "Payable"],
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "referenceType", // Dynamic reference based on referenceType field
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
    },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "card", "other"],
      required: true,
    },
    currency: { type: String, default: "USD", required: true },
    paymentDate: { type: Date, default: Date.now, required: true },
    notes: { type: String },
    recordedBy: { type: String },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({ tenantId: 1, transactionType: 1 });
PaymentSchema.index({ tenantId: 1, referenceId: 1 });
PaymentSchema.index({ tenantId: 1, paymentDate: -1 });

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
