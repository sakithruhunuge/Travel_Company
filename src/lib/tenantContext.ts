import { headers } from "next/headers";
import mongoose, { Model, Document } from "mongoose";

export interface TenantContext {
  tenantId: string | null;
  tenantSlug: string | null;
}

/**
 * Retrieves the current tenant context from the request headers.
 * Works inside Server Components, Server Actions, Route Handlers, and Layouts.
 */
export function getTenantContext(): TenantContext {
  // next/headers can throw in non-server environments, return empty if so
  try {
    const headersList = headers();
    const tenantId = headersList.get("x-tenant-id");
    const tenantSlug = headersList.get("x-tenant-slug");
    return { tenantId, tenantSlug };
  } catch (error) {
    // Fallback if called outside server request context (e.g. build time/static generation)
    return { tenantId: null, tenantSlug: null };
  }
}

/**
 * Wraps a Mongoose model to automatically scope all read, write, and delete queries
 * to the specified tenantId, ensuring logical multi-tenant database isolation.
 */
export function tenantScope<T extends Document>(
  model: Model<T>,
  tenantId: string | mongoose.Types.ObjectId
) {
  const tId = typeof tenantId === "string" ? new mongoose.Types.ObjectId(tenantId) : tenantId;

  return {
    find: (filter: any = {}) => {
      return model.find({ ...filter, tenantId: tId });
    },
    findOne: (filter: any = {}) => {
      return model.findOne({ ...filter, tenantId: tId });
    },
    findOneAndUpdate: (filter: any = {}, update: any, options?: any) => {
      return model.findOneAndUpdate({ ...filter, tenantId: tId }, update, options);
    },
    updateOne: (filter: any = {}, update: any, options?: any) => {
      return model.updateOne({ ...filter, tenantId: tId }, update, options);
    },
    updateMany: (filter: any = {}, update: any, options?: any) => {
      return model.updateMany({ ...filter, tenantId: tId }, update, options);
    },
    deleteOne: (filter: any = {}) => {
      return model.deleteOne({ ...filter, tenantId: tId });
    },
    deleteMany: (filter: any = {}) => {
      return model.deleteMany({ ...filter, tenantId: tId });
    },
    countDocuments: (filter: any = {}) => {
      return model.countDocuments({ ...filter, tenantId: tId });
    },
    create: (docs: any) => {
      if (Array.isArray(docs)) {
        return model.create(docs.map((doc) => ({ ...doc, tenantId: tId })));
      }
      return model.create({ ...docs, tenantId: tId });
    },
    // Expose the raw model under .raw if we need to escape the tenant scope
    raw: model,
  };
}
