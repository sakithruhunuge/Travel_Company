import { dbConnect } from "./mongodb";
import Tenant from "@/models/Tenant";

/**
 * Direct database resolver for Node.js environments.
 */
export async function resolveTenantFromDb(slug?: string, customDomain?: string) {
  await dbConnect();
  if (slug) {
    return await Tenant.findOne({ slug }).lean();
  } else if (customDomain) {
    return await Tenant.findOne({ customDomain }).lean();
  }
  return null;
}
