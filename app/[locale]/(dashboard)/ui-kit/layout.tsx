import { ReactNode } from 'react';

export default function UIKitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      {children}
    </div>
  );
}
