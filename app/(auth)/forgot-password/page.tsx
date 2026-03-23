'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { TriangleAlert, CheckCircle } from 'lucide-react';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: FormValues) {
    setError(null);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/Auth/ForgetPassword`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      },
    );

    if (!res.ok) {
      setError('Unable to send reset email. Please try again.');
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('ValidationEmail', values.email);
    }

    setSuccess(true);
    setTimeout(() => router.push('/verify-otp'), 1500);
  }

  return (
    <div className="w-full max-w-[400px] space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Forgot password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset code
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive" appearance="light">
              <AlertIcon>
                <TriangleAlert />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          {success && (
            <Alert variant="success" appearance="light">
              <AlertIcon>
                <CheckCircle />
              </AlertIcon>
              <AlertTitle>Reset code sent! Redirecting…</AlertTitle>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="seller@example.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isSubmitting || success}
          >
            {isSubmitting ? 'Sending…' : 'Send reset code'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link href="/signin" className="text-foreground hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
}
