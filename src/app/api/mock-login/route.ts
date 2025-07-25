// app/api/mock-login/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (email === 'anupama@gmail.com' && password === 'Secret1') {
    return NextResponse.json({
      token: 'abc123',
      user: {
        id: 'USR-000',
        avatar: '/assets/avatar.png',
        firstName: 'Anupama',
        lastName: 'Rivers',
        email,
      },
    });
  }

  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}
