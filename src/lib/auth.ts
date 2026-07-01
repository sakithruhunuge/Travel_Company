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

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image || null,
          provider: user.provider,
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
            });
          }
          return true;
        } catch (error) {
          console.error("Error in NextAuth signIn Google callback:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        // Run only on initial sign in
        try {
          await dbConnect();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.provider = dbUser.provider;
          }
        } catch (error) {
          console.error("Error in NextAuth jwt callback:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      const sessionUser = session.user as { id?: string; name?: string | null; email?: string | null; image?: string | null; provider?: string };
      if (sessionUser) {
        sessionUser.id = token.id as string;
        sessionUser.provider = token.provider as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};
