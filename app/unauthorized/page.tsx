import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Access denied</h1>
      <p className="text-sm text-muted-foreground">
        You don&apos;t have permission to view this page.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Go to dashboard</Link>
      </Button>
    </div>
  );
}
