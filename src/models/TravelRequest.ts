import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITravelRequest extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  packageId?: string;
  packageName: string;
  numberOfTravelers: number;
  preferredStartDate: Date;
  specialRequests?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const TravelRequestSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    packageId: { type: String },
    packageName: { type: String, required: true },
    numberOfTravelers: { type: Number, required: true, min: 1 },
    preferredStartDate: { type: Date, required: true },
    specialRequests: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const TravelRequest: Model<ITravelRequest> =
  mongoose.models.TravelRequest || mongoose.model<ITravelRequest>("TravelRequest", TravelRequestSchema);

export default TravelRequest;
