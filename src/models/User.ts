import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  provider: "google" | "credentials";
  role: "super_admin" | "admin" | "staff" | "customer";
  status: "active" | "suspended";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    image: { type: String },
    provider: {
      type: String,
      enum: ["google", "credentials"],
      default: "google",
      required: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "admin", "staff", "customer"],
      default: "customer",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
