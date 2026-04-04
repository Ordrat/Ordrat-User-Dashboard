'use client';

import { LoaderCircle } from 'lucide-react';

export function ScreenLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <LoaderCircle className="size-9 animate-spin text-brand" />
    </div>
  );
}
