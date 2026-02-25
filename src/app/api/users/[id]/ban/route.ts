import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const nestjsUrl = process.env.NESTJS_API_URL;

  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (!nestjsUrl) return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 });

  try {
    const response = await fetch(`${nestjsUrl}/users/${id}/ban`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json({ error: data.message || 'Erreur' }, { status: response.status });
    }
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
