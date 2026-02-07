import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import type { NextAuthOptions } from "next-auth";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { 
    signIn: '/login', 
    error: '/login' 
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Mangler email eller password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        // Tjek om brugeren findes og har et password (vigtigt for at skelne fra Google-brugere)
        if (!user || !user.password) {
          throw new Error("Bruger ikke fundet");
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!passwordMatch) {
          throw new Error("Forkert password");
        }

        // Returnér brugeren - det er her 'user' objektet sendes til JWT callback nedenfor
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
callbacks: {
    async jwt({ token, user }) {
      // Ved login er 'user' objektet det, som din authorize() funktion returnerede
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
        // console.log("JWT CALLBACK: Gemmer rolle i token:", token.role);
      }
      return token;
    },
    async session({ session, token }) {
      // Her overfører vi rollen fra token til sessionen
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        // console.log("SESSION CALLBACK: Rolle i session:", (session.user as any).role);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};