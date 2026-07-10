import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import SuperAdmin from "@/models/SuperAdmin";
import { headers } from "next/headers";
import { resolveTenant } from "@/lib/tenantResolver";

// Augment NextAuth interfaces to include role, tenantId, and slug in session & JWT
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      role: "customer" | "tenant_admin" | "super_admin";
      tenantId: string | null;
      slug: string | null;
      provider?: string;
      createdAt?: string | null;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role: "customer" | "tenant_admin" | "super_admin";
    tenantId: string | null;
    slug: string | null;
    provider?: string;
    createdAt?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "customer" | "tenant_admin" | "super_admin";
    tenantId: string | null;
    slug: string | null;
    provider?: string;
    createdAt?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await dbConnect();

        const hostname = headers().get("host") || "";
        const tenant = await resolveTenant({ hostname });

        // 1. Resolve SuperAdmin context if authenticated under the Admin portal
        if (tenant.isAdmin) {
          if (process.env.NODE_ENV === "development") {
            const adminCount = await SuperAdmin.countDocuments();
            if (adminCount === 0) {
              const salt = await bcrypt.genSalt(10);
              const hashedPassword = await bcrypt.hash("superadminpassword", salt);
              await SuperAdmin.create({
                name: "System Super Admin",
                email: "admin@travelcompany.com",
                password: hashedPassword,
              });
            }
          }
          const superAdmin = await SuperAdmin.findOne({
            email: credentials.email.toLowerCase().trim(),
          });

          if (!superAdmin) {
            throw new Error("No super administrator found with this email");
          }

          const isValidPassword = await bcrypt.compare(credentials.password, superAdmin.password || "");
          if (!isValidPassword) {
            throw new Error("Invalid password");
          }

          return {
            id: superAdmin._id.toString(),
            name: superAdmin.name,
            email: superAdmin.email,
            role: "super_admin",
            tenantId: null,
            slug: "admin",
            provider: "credentials",
          };
        }

        // 2. Resolve Tenant-Scoped User
        const user = await User.findOne({
          tenantId: tenant.id!, // Non-null assertion since it is false for tenant.isAdmin
          email: credentials.email.toLowerCase().trim(),
        });

        if (!user) {
          throw new Error("No user found with this email under this portal");
        }

        if (user.provider !== "credentials" || !user.password) {
          throw new Error("This account is registered using Google OAuth. Please sign in with Google.");
        }

        if (user.status === "suspended") {
          throw new Error("Your account has been suspended by the administrator");
        }

        if (user.status === "pending") {
          throw new Error("Your account is pending activation");
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        if (!isValidPassword) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image || null,
          role: user.role,
          tenantId: tenant.id,
          slug: tenant.slug,
          provider: user.provider,
          createdAt: user.createdAt?.toISOString(),
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        try {
          await dbConnect();
          const hostname = headers().get("host") || "";
          const tenant = await resolveTenant({ hostname });

          if (tenant.isAdmin) {
            const superAdmin = await SuperAdmin.findOne({ email: user.email });
            if (!superAdmin) {
              console.warn("Unauthorized attempt to login as SuperAdmin via Google:", user.email);
              return false;
            }
            return true;
          }

          const existingUser = await User.findOne({
            tenantId: tenant.id!,
            email: user.email,
          });

          if (!existingUser) {
            // Register as Customer under the active tenant
            await User.create({
              name: user.name || "",
              email: user.email,
              image: user.image || "",
              provider: "google",
              tenantId: tenant.id!,
              role: "customer",
              status: "active",
            });
          } else if (existingUser.status === "suspended" || existingUser.status === "pending") {
            return false;
          }
          return true;
        } catch (error) {
          console.warn("Error in NextAuth signIn Google callback:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Initial sign-in: transfer database fields to the JWT token payload
        const u = user as any;
        token.id = u.id;
        token.provider = u.provider;
        token.role = u.role;
        token.tenantId = u.tenantId || null;
        token.slug = u.slug || null;
        token.createdAt = u.createdAt || null;
      } else if (token.email) {
        // Subsequent lookups: check and sync user state with the database
        try {
          await dbConnect();
          const hostname = headers().get("host") || "";
          const tenant = await resolveTenant({ hostname });

          if (tenant.isAdmin) {
            const superAdmin = await SuperAdmin.findOne({ email: token.email });
            if (superAdmin) {
              token.id = superAdmin._id.toString();
              token.role = "super_admin";
              token.tenantId = null;
              token.slug = "admin";
            } else {
              token.id = "";
              token.role = null as any;
              token.tenantId = null;
              token.slug = null;
            }
          } else {
            const dbUser = await User.findOne({
              tenantId: tenant.id!,
              email: token.email,
            });
            if (dbUser) {
              token.id = dbUser._id.toString();
              token.provider = dbUser.provider;
              token.role = dbUser.role;
              token.tenantId = tenant.id;
              token.slug = tenant.slug;
              token.createdAt = dbUser.createdAt?.toISOString();
            } else {
              token.id = "";
              token.role = null as any;
              token.tenantId = null;
              token.slug = null;
            }
          }
        } catch (error) {
          console.warn("Error refreshing user token in NextAuth JWT callback:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Map properties from JWT token payload to the active session object
      const sessionUser = session.user as any;
      if (sessionUser) {
        sessionUser.id = token.id;
        sessionUser.provider = token.provider;
        sessionUser.createdAt = token.createdAt || null;
        sessionUser.role = token.role;
        sessionUser.tenantId = token.tenantId;
        sessionUser.slug = token.slug;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};
