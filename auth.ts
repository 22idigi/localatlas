import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/azure-ad";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/token-crypto";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    // Authentication is intentionally separate from listing-management consent.
    // Google Business Profile and Bing partner scopes belong to dedicated connectors.
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: { params: { scope: "openid email profile" } },
    }),
    AzureAD({
      clientId: process.env.AUTH_AZURE_AD_ID!,
      clientSecret: process.env.AUTH_AZURE_AD_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_AZURE_AD_TENANT_ID ?? "common"}/v2.0`,
      authorization: { params: { scope: "openid profile email offline_access" } },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  events: {
    async linkAccount({ account }) {
      // Remove adapter-written plaintext credential columns immediately after encrypting them.
      await prisma.account.update({ where: { provider_providerAccountId: { provider: account.provider, providerAccountId: account.providerAccountId } }, data: {
        encryptedAccessToken: account.access_token ? encryptToken(account.access_token) : undefined,
        encryptedRefreshToken: account.refresh_token ? encryptToken(account.refresh_token) : undefined,
        tokenExpiresAt: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
        access_token: null, refresh_token: null, id_token: null,
      }});
    },
  },
  pages: { signIn: "/login" },
});
