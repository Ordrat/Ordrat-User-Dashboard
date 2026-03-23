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
  let res: Response;

  try {
    res = await fetch(`${process.env.BACKEND_API_URL}/api/Auth/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    // Network / DNS / SSL error
    console.error('[loginWithCredentials] fetch error:', err);
    throw new Error('Service unavailable, please try again');
  }

  if (res.status === 401 || res.status === 404) {
    throw new Error('Invalid email or password');
  }

  if (!res.ok) {
    // 400, 500, etc — surface the status for debugging
    console.error('[loginWithCredentials] API error:', res.status, await res.text().catch(() => ''));
    throw new Error('Invalid email or password');
  }

  const data = await res.json();
  return LoginResponseSchema.parse(data);
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<RefreshResponseType> {
  let res: Response;

  try {
    res = await fetch(
      `${process.env.BACKEND_API_URL}/api/Auth/RefreshAccessToken`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          refreshToken,
        },
      },
    );
  } catch {
    throw new Error('RefreshAccessTokenError');
  }

  if (!res.ok) {
    throw new Error('RefreshAccessTokenError');
  }

  const data = await res.json();
  return RefreshResponseSchema.parse(data);
}
