import 'next-auth';
import 'next-auth/jwt';

interface Branch {
  id: string;
  nameEn?: string;
  nameAr?: string;
  isMain?: boolean;
  [key: string]: unknown;
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number;
    shopId: string;
    sellerId: string;
    name: string;
    email: string;
    roles: string[];
    branches: Branch[];
    mainBranchId: string | null;
    userType: string;
    subdomain: string;
    error?: 'RefreshAccessTokenError';
  }
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      shopId: string;
      roles: string[];
      branches: Branch[];
      mainBranchId: string | null;
      userType: string;
      subdomain: string;
    };
    accessToken: string;
    error?: 'RefreshAccessTokenError';
  }

  interface User {
    id: string;
    name: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    shopId: string;
    sellerId: string;
    roles: string[];
    branches: Branch[];
    mainBranchId: string | null;
    userType: string;
    subdomain: string;
  }
}
