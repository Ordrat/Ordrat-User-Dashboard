import {
  LoginResponseSchema,
  LoginResponseType,
  RefreshResponseSchema,
  RefreshResponseType,
} from './schemas';

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<LoginResponseType> {
  const res = await fetch(
    `${process.env.BACKEND_API_URL}/api/Auth/Login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    },
  );

  if (res.status === 401 || res.status === 404) {
    throw new Error('Invalid email or password');
  }

  if (res.status === 400) {
    throw new Error('Invalid request');
  }

  if (!res.ok) {
    throw new Error('Service unavailable, please try again');
  }

  const data = await res.json();
  return LoginResponseSchema.parse(data);
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<RefreshResponseType> {
  const res = await fetch(
    `${process.env.BACKEND_API_URL}/api/Auth/RefreshAccessToken`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        refreshToken,
      },
    },
  );

  if (!res.ok) {
    throw new Error('RefreshAccessTokenError');
  }

  const data = await res.json();
  return RefreshResponseSchema.parse(data);
}
