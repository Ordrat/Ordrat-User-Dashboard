'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { TriangleAlert } from 'lucide-react';

export default function VerifyOtpPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ValidationEmail');
    if (!saved) {
      router.replace(`/${locale}/forgot-password`);
      return;
    }
    setEmail(saved);
  }, [router, locale]);

  async function handleVerify() {
    if (otp.length !== 6) return;
    setError(null);
    setLoading(true);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/Auth/VerifyForgetCode`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verificationCode: otp }),
      },
    );

    setLoading(false);

    if (!res.ok) {
      setError(t('auth.invalidCode'));
      return;
    }

    const data = await res.json();
    localStorage.setItem('ResetToken', data.resetToken ?? data.ResetToken ?? '');
    router.push(`/${locale}/change-password`);
  }

  async function handleResend() {
    setResending(true);
    setError(null);

    await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/Auth/ResendVerificationCode`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      },
    );

    setResending(false);
  }

  return (
    <div className="w-full max-w-[400px] space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('auth.verifyCodeTitle')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('auth.verifyCodeDescription')}{' '}
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        {error && (
          <Alert variant="destructive" appearance="light" className="w-full">
            <AlertIcon>
              <TriangleAlert />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>

        <Button
          variant="primary"
          className="w-full"
          disabled={otp.length !== 6 || loading}
          onClick={handleVerify}
        >
          {loading ? t('actions.verifying') : t('auth.verifyCode')}
        </Button>

        <Button
          variant="ghost"
          className="w-full"
          disabled={resending}
          onClick={handleResend}
        >
          {resending ? t('actions.resending') : t('auth.resendCode')}
        </Button>
      </div>
    </div>
  );
}
