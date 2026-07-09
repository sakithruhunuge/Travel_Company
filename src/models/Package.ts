import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPackage extends Document {
  name: string;
  duration: string;
  destinations: string[];
  includes: string[];
  image: string;
  priceRange: string;
  rating: string;
  isPopular?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    duration: { type: String, required: true },
    destinations: { type: [String], required: true },
    includes: { type: [String], required: true },
    image: { type: String, required: true },
    priceRange: { type: String, required: true },
    rating: { type: String, required: true, default: "5.0" },
    isPopular: { type: Boolean, default: false }
  },
  {
    timestamps: true,
  }
);

const Package: Model<IPackage> =
  mongoose.models.Package || mongoose.model<IPackage>("Package", PackageSchema);

export default Package;
