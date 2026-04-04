import { ReactNode } from 'react';

export default function DashboardSectionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      {children}
    </div>
  );
}
