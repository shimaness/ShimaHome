import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'missing',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'missing',
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }: any) {
      if (account && profile) {
        token.role = 'TENANT';
      }
      return token;
    },
    async session({ session, token }: any) {
      (session as any).role = (token as any).role || 'TENANT';
      return session;
    },
    async redirect({ url, baseUrl }: any) {
      // Always route back to onboarding to complete KYC after OAuth
      try {
        const u = new URL(baseUrl);
        u.pathname = '/onboarding/tenant';
        return u.toString();
      } catch {
        return baseUrl;
      }
    },
  },
};
