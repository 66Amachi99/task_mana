import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const userData = session.user as any;
    const createdById = parseInt(userData.id);
    const isAdmin = userData.admin_role;
    const isSmm = userData.SMM_role;

    // Только админ и SMM могут создавать задачи
    if (!isAdmin && !isSmm) {
      return NextResponse.json(
        { error: 'Недостаточно прав для создания задачи' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      start_time,
      end_time,
      all_day,
      priority,
      assignee_id,
      tag_ids
    } = body;

    if (!title || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Заполните название и время задачи' },
        { status: 400 }
      );
    }

    // Создаем задачу
    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        created_by_id: createdById,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        all_day: all_day || false,
        priority: priority || 0,
        task_status: 'Поставлена',
        completed_task: null,
        // Создаем исполнителя, если указан
        assignees: assignee_id ? {
          create: {
            user_id: assignee_id
          }
        } : undefined,
        // Создаем теги, если указаны
        tags: tag_ids && tag_ids.length > 0 ? {
          create: tag_ids.map((tagId: number) => ({
            tag_id: tagId
          }))
        } : undefined
      },
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

    const transformedTask = {
      ...task,
      assignees: task.assignees.map((a: any) => ({
        user_id: a.user_id,
        user_login: a.user.user_login
      })),
      tags: task.tags.map((tt: any) => tt.tag),
      start_time: task.start_time.toISOString(),
      end_time: task.end_time.toISOString(),
      created_at: task.created_at.toISOString(),
      updated_at: task.updated_at.toISOString()
    };

    return NextResponse.json(
      { success: true, task: transformedTask },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании задачи' },
      { status: 500 }
    );
  }
}