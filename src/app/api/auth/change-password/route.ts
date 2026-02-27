import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { initAuthDb } from '@/src/lib/auth-db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_key_change_me_at_least_32_chars_long');

export async function PATCH(request: Request) {
  try {
    // 1. Check authentication
    const token = request.headers.get('cookie')
      ?.split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await jwtVerify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 2. Parse request body
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Verify current password
    const db = initAuthDb();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get('admin') as any;

    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    // 4. Hash and update new password
    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(newHash, 'admin');

    // 5. Clear session cookie by returning a response that expires it
    const response = NextResponse.json({ success: true, message: 'Password updated successfully' });
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Change Password API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
