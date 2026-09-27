import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { query } from "./db";
import { v4 as uuidv4 } from "uuid";
import { ACCOUNT_DEACTIVATED_ERROR } from "./authConstants";
import { getDefaultListingQuota } from "./rateCards";

export { ACCOUNT_DEACTIVATED_ERROR } from "./authConstants";

interface DbUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  password?: string;
  emailVerified: Date | null;
  isActive?: number | boolean;
}

function isUserActive(user: { isActive?: number | boolean | null }): boolean {
  // Treat missing column / null as active for safety during partial deploys
  if (user.isActive === undefined || user.isActive === null) return true;
  return Boolean(user.isActive);
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60,
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      async profile(profile) {
        try {
          // Check if user already exists
          const [existingUser] = await query<DbUser>(
            "SELECT * FROM `user` WHERE email = ?",
            [profile.email]
          );

          if (!existingUser) {
            // Create new user
            const id = uuidv4().replace(/-/g, "");
            const listingQuota = await getDefaultListingQuota();
            await query(
              "INSERT INTO `user` (id, email, name, image, emailVerified, role, isActive, listingQuota, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), ?, 1, ?, NOW(), NOW())",
              [
                id,
                profile.email,
                profile.name || null,
                profile.picture || null,
                "USER",
                listingQuota,
              ]
            );

            const [newUser] = await query<DbUser>(
              "SELECT * FROM `user` WHERE id = ?",
              [id]
            );

            return {
              id: newUser.id.toString(),
              email: newUser.email,
              name: newUser.name || profile.name || "",
              image: newUser.image || profile.picture || "",
              role: newUser.role,
            };
          }

          // Deactivated accounts cannot sign in with Google
          if (!isUserActive(existingUser)) {
            throw new Error(ACCOUNT_DEACTIVATED_ERROR);
          }

          // Update existing user's profile if needed
          if (existingUser.name !== profile.name || existingUser.image !== profile.picture) {
            await query(
              "UPDATE `user` SET name = ?, image = ?, updatedAt = NOW() WHERE id = ?",
              [profile.name || existingUser.name, profile.picture || existingUser.image, existingUser.id]
            );
          }

          return {
            id: existingUser.id.toString(),
            email: existingUser.email,
            name: existingUser.name || profile.name || "",
            image: existingUser.image || profile.picture || "",
            role: existingUser.role,
          };
        } catch (error) {
          if (error instanceof Error && error.message === ACCOUNT_DEACTIVATED_ERROR) {
            throw error;
          }
          console.error("Error in Google profile callback:", error);
          throw new Error("Failed to process Google sign-in");
        }
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const [user] = await query<DbUser>(
          "SELECT * FROM `user` WHERE email = ?",
          [credentials.email]
        );

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        if (!isUserActive(user)) {
          throw new Error(ACCOUNT_DEACTIVATED_ERROR);
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name || "",
          image: user.image || "",
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // If using Google auth, ensure we have the latest user data
      if (account?.provider === "google" && token.email) {
        const [dbUser] = await query<DbUser>(
          "SELECT id, role, name, image, isActive FROM `user` WHERE email = ?",
          [token.email]
        );

        if (dbUser) {
          if (!isUserActive(dbUser)) {
            // Force session invalidation path
            token.error = ACCOUNT_DEACTIVATED_ERROR;
          }
          token.id = dbUser.id.toString();
          token.role = dbUser.role;
          token.name = dbUser.name || token.name;
          token.picture = dbUser.image || token.picture;
        }
      }

      // Periodic re-check: if account was deactivated mid-session, flag the token
      if (token.id && !token.error) {
        try {
          const [dbUser] = await query<{ isActive: number | boolean }>(
            "SELECT isActive FROM `user` WHERE id = ?",
            [token.id as string]
          );
          if (dbUser && !isUserActive(dbUser)) {
            token.error = ACCOUNT_DEACTIVATED_ERROR;
          }
        } catch {
          // Non-fatal: do not block sessions on transient DB errors
        }
      }

      return token;
    },
    async session({ token, session }) {
      if (token.error === ACCOUNT_DEACTIVATED_ERROR) {
        // Surface deactivation so client/middleware can force sign-out
        session.error = ACCOUNT_DEACTIVATED_ERROR;
      }
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = (token.picture as string) ?? "";
        session.user.role = token.role as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Extra guard for OAuth: deny deactivated accounts cleanly
      if (account?.provider === "google" && user?.email) {
        try {
          const [dbUser] = await query<DbUser>(
            "SELECT isActive FROM `user` WHERE email = ?",
            [user.email]
          );
          if (dbUser && !isUserActive(dbUser)) {
            return `/auth/signin?error=${ACCOUNT_DEACTIVATED_ERROR}`;
          }
        } catch (error) {
          if (error instanceof Error && error.message === ACCOUNT_DEACTIVATED_ERROR) {
            return `/auth/signin?error=${ACCOUNT_DEACTIVATED_ERROR}`;
          }
          console.error("signIn callback error:", error);
        }
      }
      return true;
    },
  },
  debug: process.env.NODE_ENV === "development",
};
