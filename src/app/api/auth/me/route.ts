import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const nestjsUrl = process.env.NESTJS_API_URL;
    if (!nestjsUrl) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      );
    }

    const response = await fetch(`${nestjsUrl}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid — clear cookie
        cookieStore.delete('access_token');
        return NextResponse.json(
          { error: 'Session expirée' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: response.status }
      );
    }

    const user = await response.json();
    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
