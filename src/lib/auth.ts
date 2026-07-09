import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

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

        // Find user by email
        const user = await User.findOne({ email: credentials.email.toLowerCase().trim() });

        if (!user) {
          throw new Error("No user found with this email");
        }

        // Verify user registered via credentials provider
        if (user.provider !== "credentials" || !user.password) {
          throw new Error("This account is registered using Google OAuth. Please sign in with Google.");
        }

        // Compare password
        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error("Invalid password");
        }

        if (user.status === "suspended") {
          throw new Error("Your account has been suspended. Please contact support.");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image || null,
          provider: user.provider,
          role: user.role || "customer",
          status: user.status || "active",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Direct sign-in callback check for Google users
      if (account?.provider === "google") {
        if (!user.email) return false;
        try {
          await dbConnect();
          const existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            // Create a new User if it's a first time Google login
            await User.create({
              name: user.name || "",
              email: user.email,
              image: user.image || "",
              provider: "google",
              role: "customer",
              status: "active",
            });
          } else {
            if (existingUser.status === "suspended") {
              return false; // Reject sign in
            }
          }
          return true;
        } catch (error) {
          // Fail sign-in silently and return false; warn in server logs
          // eslint-disable-next-line no-console
          console.warn("Error in NextAuth signIn Google callback:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (trigger === "update") {
        try {
          await dbConnect();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.name = dbUser.name;
            if (dbUser.image && dbUser.image.startsWith("data:image/")) {
              token.picture = `/api/user/avatar/${dbUser._id}?t=${Date.now()}`;
            } else {
              token.picture = dbUser.image;
            }
            token.role = dbUser.role;
            token.status = dbUser.status;
          }
        } catch (error) {
          console.warn("Error in NextAuth jwt callback (update):", error);
        }
      } else if (account && user) {
        try {
          await dbConnect();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.provider = dbUser.provider;
            token.createdAt = dbUser.createdAt?.toISOString();
            token.name = dbUser.name;
            if (dbUser.image && dbUser.image.startsWith("data:image/")) {
              token.picture = `/api/user/avatar/${dbUser._id}?t=${Date.now()}`;
            } else {
              token.picture = dbUser.image;
            }
            token.role = dbUser.role;
            token.status = dbUser.status;
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn("Error in NextAuth jwt callback:", error);
        }
      } else {
        // Enforce suspension checking on active sessions
        try {
          await dbConnect();
          const dbUser = await User.findOne({ email: token.email }).select("status role");
          if (dbUser) {
            token.role = dbUser.role;
            token.status = dbUser.status;
          }
        } catch {
          // Silently skip if query fails
        }
      }
      return token;
    },
    async session({ session, token }) {
      const sessionUser = session.user as { 
        id?: string; 
        name?: string | null; 
        email?: string | null; 
        image?: string | null; 
        provider?: string; 
        role?: string;
        status?: string;
        createdAt?: string | null 
      };
      
      if (sessionUser) {
        if (token.status === "suspended") {
          // Return null to invalidate the session entirely
          return null as unknown as typeof session;
        }
        sessionUser.id = token.id as string;
        sessionUser.provider = token.provider as string;
        sessionUser.createdAt = (token.createdAt as string | undefined) || null;
        if (token.name) sessionUser.name = token.name;
        if (token.picture) sessionUser.image = token.picture;
        sessionUser.role = (token.role as string) || "customer";
        sessionUser.status = (token.status as string) || "active";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};
