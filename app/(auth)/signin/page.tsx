'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { TriangleAlert, Eye, EyeOff, ShoppingBag } from 'lucide-react';

const signinSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type SigninFormValues = z.infer<typeof signinSchema>;

export default function SigninPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SigninFormValues>({
    resolver: zodResolver(signinSchema),
    defaultValues: { email: '', password: '' },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: SigninFormValues) {
    setServerError(null);

    const result = await signIn('credentials', {
      redirect: false,
      email: values.email,
      password: values.password,
    });

    if (!result || result.error) {
      const msg = result?.error ?? '';

      if (msg.startsWith('REDIRECT:')) {
        window.location.href = msg.replace('REDIRECT:', '');
        return;
      }

      if (msg === 'Invalid email or password') {
        setServerError('Invalid email or password');
      } else if (msg === 'Email and password are required') {
        setServerError('Please enter your email and password');
      } else {
        setServerError('Unable to sign in. Please try again.');
      }
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel: form ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 lg:flex-none lg:w-[480px] xl:w-[520px]">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <ShoppingBag className="size-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">Ordrat</span>
          </div>

          <div className="mb-7 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <Alert variant="destructive" appearance="light">
                  <AlertIcon>
                    <TriangleAlert />
                  </AlertIcon>
                  <AlertTitle>{serverError}</AlertTitle>
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
                        variant="lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          variant="lg"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full h-10 text-sm font-medium mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in…' : 'Continue'}
              </Button>
            </form>
          </Form>
        </div>
      </div>

      {/* ── Right panel: visual ── */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-muted p-12 lg:flex">
        {/* Background decorative grid */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-muted" />

        {/* Top logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <ShoppingBag className="size-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Ordrat</span>
        </div>

        {/* Center content */}
        <div className="relative space-y-4 max-w-lg">
          <h2 className="text-3xl font-semibold tracking-tight leading-snug">
            Secure Dashboard Access
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            A robust authentication gateway ensuring secure and efficient
            access to your Ordrat seller dashboard.
          </p>

          {/* Feature list */}
          <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
            {[
              'Manage orders and track deliveries in real-time',
              'Control your product catalog and inventory',
              'Access sales analytics and performance reports',
              'Manage staff roles and branch settings',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <svg
                    viewBox="0 0 12 12"
                    fill="none"
                    className="size-2.5"
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom tagline */}
        <div className="relative text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Ordrat. All rights reserved.
        </div>
      </div>
    </div>
  );
}
