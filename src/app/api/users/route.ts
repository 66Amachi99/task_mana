import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        user_login: true,
        admin_role: true,
        SMM_role: true,
        designer_role: true,
        videomaker_role: true,
        coordinator_role: true,
        photographer_role: true,
      },
      orderBy: {
        user_login: 'asc',
      },
    });
    
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении пользователей' },
      { status: 500 }
    );
  }
}