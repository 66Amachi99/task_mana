import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const userData = session.user as any;
    const userId = parseInt(userData.id);
    const isAdmin = userData.admin_role;
    const isSmm = userData.SMM_role;

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const taskId = searchParams.get('id');
    const filter = searchParams.get('filter'); // 'my' или null

    if (taskId) {
      // Получаем конкретную задачу
      const task = await prisma.task.findUnique({
        where: { task_id: Number(taskId) },
        include: {
          created_by: {
            select: { user_login: true }
          },
          assignees: {
            include: {
              user: {
                select: { user_login: true }
              }
            }
          },
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      if (!task) {
        return NextResponse.json(
          { error: 'Задача не найдена' },
          { status: 404 }
        );
      }

      // Проверяем права на просмотр
      const isCreator = task.created_by_id === userId;
      const isAssignee = task.assignees.some(a => a.user_id === userId);
      const canView = isAdmin || isSmm || isCreator || isAssignee;
      
      if (!canView) {
        return NextResponse.json(
          { error: 'Нет доступа к задаче' },
          { status: 403 }
        );
      }

      const transformedTask = {
        ...task,
        assignees: task.assignees.map(a => ({
          user_id: a.user_id,
          user_login: a.user.user_login
        })),
        tags: task.tags.map(tt => tt.tag),
        start_time: task.start_time.toISOString(),
        end_time: task.end_time.toISOString(),
        created_at: task.created_at.toISOString(),
        updated_at: task.updated_at.toISOString()
      };

      return NextResponse.json({ tasks: [transformedTask] }, { status: 200 });
    }

    // Получаем все задачи с учетом прав
    const where: any = {};
    
    // Если не админ и не SMM, показываем только свои задачи (созданные или назначенные)
    if (!isAdmin && !isSmm) {
      where.OR = [
        { created_by_id: userId },
        { assignees: { some: { user_id: userId } } }
      ];
    } else if (filter === 'my') {
      // Если админ/SMM выбрали фильтр "Мои задачи"
      where.OR = [
        { created_by_id: userId },
        { assignees: { some: { user_id: userId } } }
      ];
    }

    const totalTasks = await prisma.task.count({ where });
    const totalPages = Math.ceil(totalTasks / limit);

    const tasks = await prisma.task.findMany({
      where,
      include: {
        created_by: {
          select: { user_login: true }
        },
        assignees: {
          include: {
            user: {
              select: { user_login: true }
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
        created_at: 'desc'
      },
      skip,
      take: limit
    });

    const transformedTasks = tasks.map(task => ({
      ...task,
      assignees: task.assignees.map(a => ({
        user_id: a.user_id,
        user_login: a.user.user_login
      })),
      tags: task.tags.map(tt => tt.tag),
      start_time: task.start_time.toISOString(),
      end_time: task.end_time.toISOString(),
      created_at: task.created_at.toISOString(),
      updated_at: task.updated_at.toISOString()
    }));

    return NextResponse.json({
      tasks: transformedTasks,
      currentPage: page,
      totalPages,
      totalTasks
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении задач' },
      { status: 500 }
    );
  }
}