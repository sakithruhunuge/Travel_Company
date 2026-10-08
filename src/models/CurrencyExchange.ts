import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICurrencyExchange extends Document {
  tenantId?: mongoose.Types.ObjectId;
  baseCurrency: "USD" | "EUR" | "GBP" | "LKR";
  targetCurrency: "LKR" | "USD" | "EUR" | "GBP";
  liveRate: number; // e.g. 304.85
  peggedRate: number; // e.g. 305.00
  usePegged: boolean;
  forexBufferPercent: number; // e.g. 2.5%
  source: "CBSL" | "CommercialBank" | "Manual";
  lastScrapedAt?: Date;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CurrencyExchangeSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: false, index: true },
    baseCurrency: { type: String, required: true, default: "USD" },
    targetCurrency: { type: String, required: true, default: "LKR" },
    liveRate: { type: Number, required: true, default: 300 },
    peggedRate: { type: Number, required: true, default: 300 },
    usePegged: { type: Boolean, default: false },
    forexBufferPercent: { type: Number, default: 2.5 },
    source: {
      type: String,
      enum: ["CBSL", "CommercialBank", "Manual"],
      default: "Manual",
    },
    lastScrapedAt: { type: Date },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

CurrencyExchangeSchema.index({ tenantId: 1, baseCurrency: 1, targetCurrency: 1 }, { unique: true });

const CurrencyExchange: Model<ICurrencyExchange> =
  mongoose.models.CurrencyExchange ||
  mongoose.model<ICurrencyExchange>("CurrencyExchange", CurrencyExchangeSchema);

export default CurrencyExchange;
