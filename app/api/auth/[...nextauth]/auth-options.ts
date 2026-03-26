import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { loginWithCredentials, refreshAccessToken } from '@/lib/ordrat-api/auth';
import { filterKnownRoles } from '@/config/roles';

/** Decode JWT payload without verifying signature (token already verified by backend). */
function decodeJwtClaims(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, 'base64url').toString('utf-8'));
  } catch {
    return {};
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        let data;
        try {
          data = await loginWithCredentials(
            credentials.email,
            credentials.password,
          );
        } catch (err) {
          // Re-throw Error instances so NextAuth passes the message to the client
          console.error('[authorize] loginWithCredentials error:', err);
          if (err instanceof Error) throw err;
          throw new Error('Service unavailable, please try again');
        }

        // shopId is not in the response body — it lives as a JWT claim
        const claims = decodeJwtClaims(data.accessToken);
        const shopId = typeof claims.shopId === 'string' ? claims.shopId : '';

        return {
          id: data.id,
          name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          shopId,
          sellerId: data.id,
          roles: filterKnownRoles(data.roles),
          branches: [],
          mainBranchId: null,
          userType: '',
          subdomain: '',
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      // Session update triggered from client (e.g. after shop creation) — force token refresh
      // so the new shopId claim is picked up without requiring sign-out
      if (trigger === 'update') {
        try {
          const refreshed = await refreshAccessToken(token.refreshToken);
          const refreshedClaims = decodeJwtClaims(refreshed.accessToken);
          return {
            ...token,
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            accessTokenExpiresAt: Date.now() + 55 * 60 * 1000,
            shopId: typeof refreshedClaims.shopId === 'string' ? refreshedClaims.shopId : token.shopId,
            error: undefined,
          };
        } catch {
          return token;
        }
      }

      // Initial sign-in — populate JWT from user object
      if (trigger === 'signIn' && user) {
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpiresAt: Date.now() + 55 * 60 * 1000,
          shopId: user.shopId,
          sellerId: user.sellerId,
          name: user.name ?? '',
          email: user.email ?? '',
          roles: user.roles,
          branches: user.branches,
          mainBranchId: user.mainBranchId,
          userType: user.userType,
          subdomain: user.subdomain,
        };
      }

      // Token still valid
      if (Date.now() < (token.accessTokenExpiresAt ?? 0) - 60_000) {
        return token;
      }

      // Attempt silent token refresh
      try {
        const refreshed = await refreshAccessToken(token.refreshToken);
        const refreshedClaims = decodeJwtClaims(refreshed.accessToken);
        const refreshedShopId =
          typeof refreshedClaims.shopId === 'string'
            ? refreshedClaims.shopId
            : token.shopId;

        return {
          ...token,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          accessTokenExpiresAt: Date.now() + 55 * 60 * 1000,
          shopId: refreshedShopId,
          roles: filterKnownRoles(refreshed.roles),
          error: undefined,
        };
      } catch {
        return { ...token, error: 'RefreshAccessTokenError' as const };
      }
    },

    async session({ session, token }) {
      session.user = {
        id: token.sellerId,
        name: token.name ?? '',
        email: token.email ?? '',
        shopId: token.shopId,
        roles: token.roles ?? [],
        branches: token.branches ?? [],
        mainBranchId: token.mainBranchId,
        userType: token.userType,
        subdomain: token.subdomain,
      };
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },

  pages: {
    signIn: '/en/signin',
    error: '/en/signin',
  },

  session: {
    strategy: 'jwt',
  },

  secret: process.env.NEXTAUTH_SECRET,
};
