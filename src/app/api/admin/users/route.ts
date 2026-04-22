import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).admin_role) {
    throw new Error('Forbidden');
  }
  return session;
}

export async function GET() {
  try {
    await checkAdmin();
    const users = await prisma.user.findMany({
      orderBy: { user_login: 'asc' },
    });
    const safeUsers = users.map(({ user_password, ...u }) => u);
    return NextResponse.json(safeUsers);
  } catch (e) {
    return NextResponse.json({ error: 'No access' }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    await checkAdmin();
    const data = await req.json();

    const existing = await prisma.user.findFirst({
      where: { user_login: data.user_login }
    });

    if (existing) {
      return NextResponse.json({ error: 'Логин занят' }, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data: {
        user_login: data.user_login,
        user_password: data.user_password,
        admin_role: !!data.admin_role,
        SMM_role: !!data.SMM_role,
        designer_role: !!data.designer_role,
        coordinator_role: !!data.coordinator_role,
        photographer_role: !!data.photographer_role,
      }
    });

    return NextResponse.json(newUser);
  } catch (e) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}