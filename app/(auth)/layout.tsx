import { ReactNode } from 'react';

// Auth pages manage their own full-screen layouts
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
