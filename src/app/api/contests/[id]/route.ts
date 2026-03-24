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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getTokenAndUrl();
  if ('error' in ctx) return ctx.error;

  const { id } = await params;

  try {
    const response = await fetch(`${ctx.nestjsUrl}/contests/${id}`, {
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getTokenAndUrl();
  if ('error' in ctx) return ctx.error;

  const { id } = await params;

  try {
    const body = await request.json();
    const response = await fetch(`${ctx.nestjsUrl}/contests/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${ctx.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getTokenAndUrl();
  if ('error' in ctx) return ctx.error;

  const { id } = await params;

  try {
    const response = await fetch(`${ctx.nestjsUrl}/contests/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ctx.token}` },
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
