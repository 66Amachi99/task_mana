import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Получить комментарии для поста
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const taskTypeId = searchParams.get('taskTypeId');

    if (!postId) {
      return NextResponse.json(
        { error: 'Не указан ID поста' },
        { status: 400 }
      );
    }

    const where: any = { post_id: Number(postId) };
    if (taskTypeId) {
      where.task_type_id = Number(taskTypeId);
    }

    const comments = await prisma.comment.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(comments, { status: 200 });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении комментариев' },
      { status: 500 }
    );
  }
}

// Создать новый комментарий
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, taskTypeId, text } = body;

    if (!postId || !taskTypeId || !text) {
      return NextResponse.json(
        { error: 'Не указаны обязательные поля' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        post_id: Number(postId),
        task_type_id: Number(taskTypeId),
        text: text.trim(),
        status: '#FF4C4C33', // красный по умолчанию
      },
    });

    // Обновляем поле has_active_comments для соответствующей задачи
    const taskTypeToField = {
      1: 'has_active_comments_mini_video_smm',
      2: 'has_active_comments_video',
      3: 'has_active_comments_text',
      4: 'has_active_comments_photogallery',
      5: 'has_active_comments_cover_photo',
      6: 'has_active_comments_photo_cards',
      7: 'has_active_comments_mini_gallery',
    };

    const fieldName = taskTypeToField[taskTypeId as keyof typeof taskTypeToField];
    if (fieldName) {
      await prisma.post.update({
        where: { post_id: Number(postId) },
        data: { [fieldName]: true },
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании комментария' },
      { status: 500 }
    );
  }
}

// Обновить статус комментария
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { commentId, status } = body;

    if (!commentId || !status) {
      return NextResponse.json(
        { error: 'Не указаны обязательные поля' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const comment = await prisma.comment.update({
      where: { id: Number(commentId) },
      data: { status },
    });

    // Проверяем, остались ли активные комментарии для этой задачи
    const activeComments = await prisma.comment.count({
      where: {
        post_id: comment.post_id,
        task_type_id: comment.task_type_id,
        status: { in: ['#FF4C4C33', '#FFD70033'] }, // красный или желтый
      },
    });

    // Обновляем поле has_active_comments для соответствующей задачи
    const taskTypeToField = {
      1: 'has_active_comments_mini_video_smm',
      2: 'has_active_comments_video',
      3: 'has_active_comments_text',
      4: 'has_active_comments_photogallery',
      5: 'has_active_comments_cover_photo',
      6: 'has_active_comments_photo_cards',
      7: 'has_active_comments_mini_gallery',
    };

    const fieldName = taskTypeToField[comment.task_type_id as keyof typeof taskTypeToField];
    if (fieldName) {
      await prisma.post.update({
        where: { post_id: comment.post_id },
        data: { [fieldName]: activeComments > 0 },
      });
    }

    return NextResponse.json(comment, { status: 200 });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении комментария' },
      { status: 500 }
    );
  }
}

// Удалить комментарий
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json(
        { error: 'Не указан ID комментария' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.delete({
      where: { id: Number(commentId) },
    });

    // Проверяем, остались ли активные комментарии для этой задачи
    const activeComments = await prisma.comment.count({
      where: {
        post_id: comment.post_id,
        task_type_id: comment.task_type_id,
        status: { in: ['#FF4C4C33', '#FFD70033'] },
      },
    });

    // Обновляем поле has_active_comments
    const taskTypeToField = {
      1: 'has_active_comments_mini_video_smm',
      2: 'has_active_comments_video',
      3: 'has_active_comments_text',
      4: 'has_active_comments_photogallery',
      5: 'has_active_comments_cover_photo',
      6: 'has_active_comments_photo_cards',
      7: 'has_active_comments_mini_gallery',
    };

    const fieldName = taskTypeToField[comment.task_type_id as keyof typeof taskTypeToField];
    if (fieldName) {
      await prisma.post.update({
        where: { post_id: comment.post_id },
        data: { [fieldName]: activeComments > 0 },
      });
    }

    return NextResponse.json(
      { success: true, message: 'Комментарий успешно удален' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении комментария' },
      { status: 500 }
    );
  }
}