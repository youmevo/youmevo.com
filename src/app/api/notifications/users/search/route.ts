import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function getTokenAndUrl() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const nestjsUrl = process.env.NESTJS_API_URL;
  if (!token) return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) };
  if (!nestjsUrl) return { error: NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 }) };
  return { token, nestjsUrl };
}

export async function GET(request: NextRequest) {
  const ctx = await getTokenAndUrl();
  if ('error' in ctx) return ctx.error;

  const q = request.nextUrl.searchParams.get('q') || '';

  try {
    const response = await fetch(`${ctx.nestjsUrl}/notifications/users/search?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${ctx.token}` },
    });
    if (!response.ok) {
      return NextResponse.json({ error: 'Erreur serveur' }, { status: response.status });
    }
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
