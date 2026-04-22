import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.admin_role) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const data = await req.json();

    if (id === parseInt(session.user.id) && data.admin_role === false) {
      return NextResponse.json({ error: 'Нельзя лишить себя прав администратора' }, { status: 400 });
    }

    const { user_id, ...updateData } = data;

    if (!updateData.user_password || updateData.user_password.trim() === '') {
      delete updateData.user_password;
    }

    const updated = await prisma.user.update({
      where: { user_id: id },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update Error:', error);
    return NextResponse.json({ error: 'Ошибка при обновлении' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.admin_role) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const adminId = parseInt(session.user.id);

    if (id === adminId) {
      return NextResponse.json({ error: 'Нельзя удалить самого себя' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: { created_by_id: id },
        data: { created_by_id: adminId }
      });

      try {
        await (tx as any).comment.updateMany({
          where: { created_by_id: id },
          data: { created_by_id: adminId }
        });
      } catch (e) { }

      try {
        await (tx as any).taskAssignment.deleteMany({
          where: { user_id: id }
        });
      } catch (e) { }

      await tx.user.delete({
        where: { user_id: id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Error:', error);
    
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Нельзя удалить пользователя: у него есть связанные данные (посты или задачи). Сначала удалите его контент вручную.' 
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Ошибка при удалении' }, { status: 500 });
  }
}