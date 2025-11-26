import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.warn("Auth: Missing credentials");
            return null;
          }

          const email = typeof credentials.email === 'string' ? credentials.email : '';
          const password = typeof credentials.password === 'string' ? credentials.password : '';

          if (!email || !password) {
            console.warn("Auth: Invalid credential types");
            return null;
          }

          let user;
          try {
            user = await prisma.adminUser.findUnique({
              where: { email },
            });
          } catch (dbError: any) {
            // Database connection error
            console.error("Auth: Database error:", dbError?.message || dbError);
            // Throw a more specific error that NextAuth can handle
            throw new Error("Database connection failed");
          }

          if (!user) {
            console.warn(`Auth: User not found for email: ${email}`);
            return null;
          }

          const isValid = await bcrypt.compare(password, user.passwordHash);

          if (!isValid) {
            console.warn(`Auth: Invalid password for email: ${email}`);
            return null;
          }

          return {
            id: user.id.toString(),
            email: user.email,
            role: user.role,
          };
        } catch (error: any) {
          // Log the error for debugging
          console.error("Auth: Authorize error:", error?.message || error);
          // Re-throw database errors so NextAuth can handle them properly
          if (error?.message?.includes("Database connection failed")) {
            throw error;
          }
          // For other errors, return null to indicate authentication failure
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
});

// Export authOptions for use in API routes
export const authOptions = {
  ...handlers,
};

