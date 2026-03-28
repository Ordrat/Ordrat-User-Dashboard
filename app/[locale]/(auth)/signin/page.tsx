'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, LoaderCircle, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AuthBrandText } from '@/components/auth/auth-brand-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export default function SigninPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? `/${locale}/dashboard`;
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const signinSchema = z.object({
    email: z.string().min(1, t('validation.emailRequired')).email(t('validation.invalidEmail')),
    password: z.string().min(1, t('validation.passwordRequired')),
    rememberMe: z.boolean(),
  });

  type SigninFormValues = z.infer<typeof signinSchema>;

  const form = useForm<SigninFormValues>({
    resolver: zodResolver(signinSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
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
        setServerError(t('auth.invalidCredentials'));
      } else if (msg === 'Email and password are required') {
        setServerError(t('auth.enterCredentials'));
      } else {
        setServerError(t('auth.unableToSignIn'));
      }
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="block w-full space-y-5"
      >
        <div className="space-y-1.5 pb-3">
          <h1 className="text-2xl font-semibold tracking-tight text-center">
            <AuthBrandText text={t('auth.signIn')} />
          </h1>
        </div>

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
              <FormLabel>{t('auth.email')}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  autoComplete="email"
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
              <div className="flex justify-between items-center gap-2.5">
                <FormLabel>{t('auth.password')}</FormLabel>
                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-sm font-semibold text-foreground hover:text-primary"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Input
                  placeholder={t('auth.passwordPlaceholder')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...field}
                />
                <Button
                  type="button"
                  variant="ghost"
                  mode="icon"
                  size="sm"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute end-0 top-1/2 -translate-y-1/2 h-7 w-7 me-1.5 bg-transparent!"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="text-muted-foreground" />
                  ) : (
                    <Eye className="text-muted-foreground" />
                  )}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember-me"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(!!checked)}
                />
                <label
                  htmlFor="remember-me"
                  className="text-sm leading-none text-muted-foreground cursor-pointer"
                >
                  {t('auth.rememberMe')}
                </label>
              </div>
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2.5">
          <Button type="submit" disabled={isSubmitting} className="w-full auth-brand-button">
            {isSubmitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : null}
            {t('actions.continue')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
