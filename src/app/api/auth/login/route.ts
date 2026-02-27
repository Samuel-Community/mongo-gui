import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { verifyAdminPassword } from '@/src/lib/auth-db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_key_change_me_at_least_32_chars_long');

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (username === 'admin' && verifyAdminPassword(password)) {
      const token = await new SignJWT({ username })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(JWT_SECRET);

      const response = NextResponse.json({ success: true });
      
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
