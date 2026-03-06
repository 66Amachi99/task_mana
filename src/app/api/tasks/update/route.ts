import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { taskId, data } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Не указан ID задачи' },
        { status: 400 }
      );
    }

    const existingTask = await prisma.task.findUnique({
      where: { task_id: Number(taskId) },
      include: {
        assignees: true
      }
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Задача не найдена' },
        { status: 404 }
      );
    }

    // Проверяем права на редактирование
    const isCreator = existingTask.created_by_id === userId;
    const isAssignee = existingTask.assignees.some(a => a.user_id === userId);
    const canEdit = isAdmin || isCreator || isAssignee;
    
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Нет прав на редактирование задачи' },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      start_time,
      end_time,
      all_day,
      priority,
      task_status,
      completed_task,
      assignee_ids, // Изменено: теперь массив ID
      tag_ids
    } = data;

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (start_time !== undefined) updateData.start_time = new Date(start_time);
    if (end_time !== undefined) updateData.end_time = new Date(end_time);
    if (all_day !== undefined) updateData.all_day = all_day;
    if (priority !== undefined) updateData.priority = priority;
    if (task_status !== undefined) updateData.task_status = task_status;
    if (completed_task !== undefined) updateData.completed_task = completed_task;

    // Обновляем основные поля задачи
    const updatedTask = await prisma.task.update({
      where: { task_id: Number(taskId) },
      data: updateData
    });

    // Обновляем исполнителей, если передан массив
    if (assignee_ids !== undefined) {
      // Удаляем всех текущих исполнителей
      await prisma.taskAssignee.deleteMany({
        where: { task_id: Number(taskId) }
      });

      // Создаем новых исполнителей
      if (assignee_ids.length > 0) {
        await prisma.taskAssignee.createMany({
          data: assignee_ids.map((userId: number) => ({
            task_id: Number(taskId),
            user_id: userId
          }))
        });
      }
    }

    // Обновляем теги, если переданы
    if (tag_ids && Array.isArray(tag_ids)) {
      await prisma.taskTag.deleteMany({
        where: { task_id: Number(taskId) }
      });

      if (tag_ids.length > 0) {
        await prisma.taskTag.createMany({
          data: tag_ids.map((tagId: number) => ({
            task_id: Number(taskId),
            tag_id: tagId
          }))
        });
      }
    }

    // Получаем обновленную задачу со всеми связями
    const finalTask = await prisma.task.findUnique({
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

    const transformedTask = {
      ...finalTask,
      assignees: finalTask?.assignees.map((a: any) => ({
        user_id: a.user_id,
        user_login: a.user.user_login
      })),
      tags: finalTask?.tags.map((tt: any) => tt.tag),
      start_time: finalTask?.start_time.toISOString(),
      end_time: finalTask?.end_time.toISOString(),
      created_at: finalTask?.created_at.toISOString(),
      updated_at: finalTask?.updated_at.toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Задача успешно обновлена',
      task: transformedTask
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении задачи' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { taskId, status, completed_task } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Не указан ID задачи' },
        { status: 400 }
      );
    }

    const existingTask = await prisma.task.findUnique({
      where: { task_id: Number(taskId) },
      include: {
        assignees: true
      }
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Задача не найдена' },
        { status: 404 }
      );
    }

    // Проверяем права на обновление
    const isCreator = existingTask.created_by_id === userId;
    const isAssignee = existingTask.assignees.some(a => a.user_id === userId);
    const canEdit = isAdmin || isCreator || isAssignee;
    
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Нет прав на обновление задачи' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (status !== undefined) updateData.task_status = status;
    if (completed_task !== undefined) updateData.completed_task = completed_task;

    const updatedTask = await prisma.task.update({
      where: { task_id: Number(taskId) },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Статус задачи обновлен',
      task: updatedTask
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating task status:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении статуса задачи' },
      { status: 500 }
    );
  }
}