import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const ACTIVE_COMMENT_STATUSES = ['new', 'completed'];

const taskTypeToField: Record<number, string> = {
  1: 'has_active_comments_mini_video_smm',
  2: 'has_active_comments_video',
  3: 'has_active_comments_text',
  4: 'has_active_comments_photogallery',
  5: 'has_active_comments_cover_photo',
  6: 'has_active_comments_photo_cards',
  7: 'has_active_comments_mini_gallery',
};

async function updatePostActiveCommentsFlag(postId: number, taskTypeId: number) {
  const activeComments = await prisma.comment.count({
    where: {
      post_id: postId,
      task_type_id: taskTypeId,
      status: { in: ACTIVE_COMMENT_STATUSES },
    },
  });

  const fieldName = taskTypeToField[taskTypeId];

  if (fieldName) {
    await prisma.post.update({
      where: { post_id: postId },
      data: { [fieldName]: activeComments > 0 },
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const taskTypeId = searchParams.get('taskTypeId');

    if (!postId) {
      return NextResponse.json({ error: 'Не указан ID поста' }, { status: 400 });
    }

    const where: any = { post_id: Number(postId) };
    if (taskTypeId) where.task_type_id = Number(taskTypeId);

    const comments = await prisma.comment.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        created_by: {
          select: {
            user_id: true,
            user_login: true,
          },
        },
      },
    });

    return NextResponse.json(comments, { status: 200 });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Ошибка при получении комментариев' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type должен быть application/json' }, { status: 400 });
    }

    const body = await request.json();
    const { postId, taskTypeId, text } = body;

    if (!postId || !taskTypeId || !text?.trim()) {
      return NextResponse.json({ error: 'Не указаны обязательные поля' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const sessionUser = session.user as any;
    const currentUserId = Number(sessionUser.id);

    if (!currentUserId) {
      return NextResponse.json({ error: 'Некорректный пользователь в сессии' }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { post_id: Number(postId) },
    });

    if (!post) {
      return NextResponse.json({ error: 'Пост не найден' }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        post_id: Number(postId),
        created_by_id: currentUserId,
        task_type_id: Number(taskTypeId),
        text: text.trim(),
        status: 'new',
      },
      include: {
        created_by: {
          select: {
            user_id: true,
            user_login: true,
          },
        },
      },
    });

    await updatePostActiveCommentsFlag(Number(postId), Number(taskTypeId));

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании комментария: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка') },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type должен быть application/json' }, { status: 400 });
    }

    const body = await request.json();
    const { commentId, status } = body;

    if (!commentId || !status) {
      return NextResponse.json({ error: 'Не указаны обязательные поля' }, { status: 400 });
    }

    if (!['new', 'completed', 'confirmed'].includes(status)) {
      return NextResponse.json({ error: 'Некорректный статус комментария' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const comment = await prisma.comment.update({
      where: { id: Number(commentId) },
      data: { status },
      include: {
        created_by: {
          select: {
            user_id: true,
            user_login: true,
          },
        },
      },
    });

    await updatePostActiveCommentsFlag(comment.post_id, comment.task_type_id);

    return NextResponse.json(comment, { status: 200 });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Ошибка при обновлении комментария' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json({ error: 'Не указан ID комментария' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const sessionUser = session.user as any;
    const currentUserId = Number(sessionUser.id);
    const isAdmin = !!sessionUser.admin_role;

    const existingComment = await prisma.comment.findUnique({
      where: { id: Number(commentId) },
    });

    if (!existingComment) {
      return NextResponse.json({ error: 'Комментарий не найден' }, { status: 404 });
    }

    const canDelete = isAdmin || existingComment.created_by_id === currentUserId;

    if (!canDelete) {
      return NextResponse.json({ error: 'Недостаточно прав для удаления комментария' }, { status: 403 });
    }

    const comment = await prisma.comment.delete({
      where: { id: Number(commentId) },
    });

    await updatePostActiveCommentsFlag(comment.post_id, comment.task_type_id);

    return NextResponse.json({ success: true, message: 'Комментарий удалён' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Ошибка при удалении комментария' }, { status: 500 });
  }
}