import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { loginWithCredentials, refreshAccessToken } from '@/lib/ordrat-api/auth';
import { filterKnownRoles } from '@/config/roles';

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
          if (err instanceof Error) throw err;
          throw new Error('Service unavailable, please try again');
        }

        // Incomplete seller setup — redirect to onboarding
        if (!data.shopId) {
          throw new Error(
            `REDIRECT:https://ordrat.com/seller-setup?sellerId=${data.id}`,
          );
        }

        const mainBranch =
          data.branches.find((b) => b.isMain) ?? data.branches[0] ?? null;

        return {
          id: data.id,
          name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          shopId: data.shopId,
          sellerId: data.id,
          roles: filterKnownRoles(data.roles),
          branches: data.branches,
          mainBranchId: mainBranch?.id ?? null,
          userType: data.userType,
          subdomain: data.subdomain,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
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
        const mainBranch =
          refreshed.branches.find((b) => b.isMain) ??
          refreshed.branches[0] ??
          null;

        return {
          ...token,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          accessTokenExpiresAt: Date.now() + 55 * 60 * 1000,
          roles: filterKnownRoles(refreshed.roles),
          branches: refreshed.branches,
          mainBranchId: mainBranch?.id ?? null,
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
    signIn: '/signin',
    error: '/signin',
  },

  session: {
    strategy: 'jwt',
  },

  secret: process.env.NEXTAUTH_SECRET,
};
