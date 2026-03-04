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
    const isAdmin = userData.admin_role;
    const isSmm = userData.SMM_role;

    // Только админ и SMM могут удалять задачи
    if (!isAdmin && !isSmm) {
      return NextResponse.json(
        { error: 'Недостаточно прав для удаления задачи' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('id');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Не указан ID задачи' },
        { status: 400 }
      );
    }

    // Сначала удаляем связанные записи (каскадно или вручную)
    await prisma.taskAssignee.deleteMany({
      where: { task_id: Number(taskId) }
    });

    await prisma.taskTag.deleteMany({
      where: { task_id: Number(taskId) }
    });

    // Затем удаляем саму задачу
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