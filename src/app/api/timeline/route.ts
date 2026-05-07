import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const filterMy = searchParams.get('filterMy') === 'true';
    const userId = parseInt((session.user as any).id);

    // Получаем все посты (фильтрация по ролям будет на клиенте)
    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            user_id: true,
            user_login: true,
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: {
        post_date: 'asc'
      }
    });

    // Получаем задачи
    const tasks = await prisma.task.findMany({
      where: filterMy ? {
        assignees: {
          some: {
            user_id: userId
          }
        }
      } : undefined,
      include: {
        assignees: {
          include: {
            user: {
              select: {
                user_id: true,
                user_login: true,
              }
            }
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: {
        start_time: 'asc'
      }
    });

    return NextResponse.json({ posts, tasks });
  } catch (error) {
    console.error('Timeline API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
