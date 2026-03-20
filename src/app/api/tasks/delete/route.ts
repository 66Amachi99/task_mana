import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('id');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Не указан ID задачи' },
        { status: 400 }
      );
    }

    const existingTask = await prisma.task.findUnique({
      where: { task_id: Number(taskId) }
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Задача не найдена' },
        { status: 404 }
      );
    }

    const isCreator = existingTask.created_by_id === userId;
    const canDelete = isAdmin || isCreator;

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Недостаточно прав для удаления задачи' },
        { status: 403 }
      );
    }

    await prisma.taskAssignee.deleteMany({
      where: { task_id: Number(taskId) }
    });

    await prisma.taskTag.deleteMany({
      where: { task_id: Number(taskId) }
    });

    await prisma.task.delete({
      where: { task_id: Number(taskId) }
    });

    return NextResponse.json(
      { success: true, message: 'Задача успешно удалена' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении задачи' },
      { status: 500 }
    );
  }
}