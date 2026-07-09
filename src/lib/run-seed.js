/* eslint-disable */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = "mongodb://localhost:27017/travel-company";

// Define the User Schema directly in the script to avoid ES import issues
const UserSchema = new mongoose.Schema(
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

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function run() {
  try {
    console.log("Connecting to MongoDB at:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully.");

    const superAdminEmail = "admin@horizon.com";
    const existingAdmin = await User.findOne({ email: superAdminEmail });

    if (existingAdmin) {
      console.log(`Super Admin already exists with email: ${superAdminEmail}`);
      // Ensure the existing admin has the correct role
      if (existingAdmin.role !== "super_admin") {
        existingAdmin.role = "super_admin";
        await existingAdmin.save();
        console.log(`Updated existing user role to super_admin`);
      }
    } else {
      console.log(`Creating new Super Admin with email: ${superAdminEmail}`);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("adminpassword123", salt);

      await User.create({
        name: "Super Admin",
        email: superAdminEmail,
        password: hashedPassword,
        provider: "credentials",
        role: "super_admin",
        status: "active",
      });
      console.log("Super Admin user created successfully.");
    }
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

run();
