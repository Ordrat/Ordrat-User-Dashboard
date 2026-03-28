'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

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
import { TriangleAlert } from 'lucide-react';

export default function ChangePasswordPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');

  const schema = z
    .object({
      newPassword: z
        .string()
        .min(8, t('validation.passwordMin')),
      confirmPassword: z.string().min(1, t('validation.confirmPasswordRequired')),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: t('validation.passwordsDoNotMatch'),
      path: ['confirmPassword'],
    });

  type FormValues = z.infer<typeof schema>;

  useEffect(() => {
    const savedEmail = localStorage.getItem('ValidationEmail');
    const savedToken = localStorage.getItem('ResetToken');
    if (!savedEmail || !savedToken) {
      router.replace(`/${locale}/forgot-password`);
      return;
    }
    setEmail(savedEmail);
    setResetToken(savedToken);
  }, [router, locale]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: FormValues) {
    setError(null);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/Auth/ResetPassword`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          newPassword: values.newPassword,
          resetToken,
        }),
      },
    );

    if (!res.ok) {
      setError(t('auth.resetFailed'));
      return;
    }

    localStorage.removeItem('ValidationEmail');
    localStorage.removeItem('ResetToken');
    router.push(`/${locale}/signin`);
  }

  return (
    <div className="w-full max-w-[400px] space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('auth.setNewPasswordTitle')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('auth.setNewPasswordDescription')}
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

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.newPassword')}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.confirmPassword')}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
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
            className="w-full auth-brand-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('actions.saving') : t('auth.setNewPassword')}
          </Button>
        </form>
      </Form>
    </div>
  );
}
