import { headers } from "next/headers";
import mongoose from "mongoose";
import User from "@/models/User";
import TravelRequest from "@/models/TravelRequest";
import Package from "@/models/Package";
import DriverGuide from "@/models/DriverGuide";
import SeasonRateTier from "@/models/SeasonRateTier";
import CurrencyExchange from "@/models/CurrencyExchange";
import HotelContractRate from "@/models/HotelContractRate";
import VehiclePricingPackage from "@/models/VehiclePricingPackage";
import AttractionRate from "@/models/AttractionRate";
import { resolveTenant } from "@/lib/tenantResolver";

export interface TenantContext {
  tenantId: string | null;
  tenantSlug: string | null;
}

/**
 * Retrieves the current tenant context from the request headers.
 * Works inside Server Components, Server Actions, Route Handlers, and Layouts.
 */
export function getTenantContext(): TenantContext {
  try {
    const headersList = headers();
    const tenantId = headersList.get("x-tenant-id");
    const tenantSlug = headersList.get("x-tenant-slug");
    return { tenantId, tenantSlug };
  } catch (error) {
    return { tenantId: null, tenantSlug: null };
  }
}

/**
 * Robustly resolves active tenantId across session, x-tenant-id header, and host header lookup.
 */
export async function resolveTenantId(sessionUser?: any): Promise<string | null> {
  const { tenantId: headerTenantId } = getTenantContext();
  if (headerTenantId) {
    return headerTenantId;
  }
  if (sessionUser?.tenantId) {
    return sessionUser.tenantId;
  }
  try {
    const requestHeaders = headers();
    const hostname = requestHeaders.get("host") || "";
    if (hostname) {
      const resolved = await resolveTenant({ hostname });
      return resolved.id;
    }
  } catch (err) {
    console.warn("resolveTenantId failed:", err);
  }
  return null;
}

/**
 * Helper to build a standard tenant-scoped model wrapper
 */
function createScopedModel<T extends mongoose.Document>(
  model: mongoose.Model<T>,
  tId: mongoose.Types.ObjectId
) {
  return {
    find: (filter: any = {}) => model.find({ ...filter, tenantId: tId }),
    findOne: (filter: any = {}) => model.findOne({ ...filter, tenantId: tId }),
    findOneAndUpdate: (filter: any = {}, update: any, options?: any) =>
      model.findOneAndUpdate({ ...filter, tenantId: tId }, update, options),
    updateOne: (filter: any = {}, update: any, options?: any) =>
      model.updateOne({ ...filter, tenantId: tId }, update, options),
    updateMany: (filter: any = {}, update: any, options?: any) =>
      model.updateMany({ ...filter, tenantId: tId }, update, options),
    deleteOne: (filter: any = {}) => model.deleteOne({ ...filter, tenantId: tId }),
    deleteMany: (filter: any = {}) => model.deleteMany({ ...filter, tenantId: tId }),
    countDocuments: (filter: any = {}) => model.countDocuments({ ...filter, tenantId: tId }),
    create: (docs: any) => {
      if (Array.isArray(docs)) {
        return model.create(docs.map((doc) => ({ ...doc, tenantId: tId })));
      }
      return model.create({ ...docs, tenantId: tId });
    },
    raw: model,
  };
}

/**
 * Creates a tenant-scoped database context object.
 * Returns pre-scoped wrappers around User, TravelRequest, Package, DriverGuide,
 * SeasonRateTier, CurrencyExchange, HotelContractRate, VehiclePricingPackage, and AttractionRate.
 */
export function tenantScope(tenantId: string | mongoose.Types.ObjectId) {
  const tId = typeof tenantId === "string" ? new mongoose.Types.ObjectId(tenantId) : tenantId;

  return {
    User: createScopedModel(User, tId),
    TravelRequest: createScopedModel(TravelRequest, tId),
    Package: createScopedModel(Package, tId),
    DriverGuide: createScopedModel(DriverGuide, tId),
    SeasonRateTier: createScopedModel(SeasonRateTier, tId),
    CurrencyExchange: createScopedModel(CurrencyExchange, tId),
    HotelContractRate: createScopedModel(HotelContractRate, tId),
    VehiclePricingPackage: createScopedModel(VehiclePricingPackage, tId),
    AttractionRate: createScopedModel(AttractionRate, tId),
  };
}

