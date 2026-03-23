'use client';

import { getSession, signOut } from 'next-auth/react';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? '';

interface FetchOptions extends RequestInit {
  _retry?: boolean;
}

export async function ordratFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const session = await getSession();
  const token = session?.accessToken;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && !options._retry) {
    // Force session refresh then retry once
    const refreshed = await getSession();
    if (refreshed?.accessToken && refreshed.accessToken !== token) {
      return ordratFetch<T>(path, {
        ...options,
        _retry: true,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${refreshed.accessToken}`,
        },
      });
    }

    // Still 401 after refresh — sign out
    await signOut({ callbackUrl: '/signin' });
    throw new Error('Session expired');
  }

  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}
