import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const nestjsUrl = process.env.NESTJS_API_URL;
    if (!nestjsUrl) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      );
    }

    const response = await fetch(`${nestjsUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Identifiants invalides' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const token = data.access_token || data.token;

    if (!token) {
      return NextResponse.json(
        { error: 'Token non reçu du serveur' },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
