import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Props {
  params: {
    id: string;
  };
}

// Получить конкретный тег
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const tagId = parseInt(params.id);

    if (isNaN(tagId)) {
      return NextResponse.json(
        { error: 'Неверный ID тега' },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.findUnique({
      where: { tag_id: tagId },
      include: {
        posts: {
          include: {
            post: {
              select: {
                post_id: true,
                post_title: true,
              },
            },
          },
          take: 10, // Ограничиваем количество постов
        },
        tasks: {
          include: {
            task: {
              select: {
                task_id: true,
                title: true,
              },
            },
          },
          take: 10,
        },
      },
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'Тег не найден' },
        { status: 404 }
      );
    }

    // Трансформируем данные для удобства
    const transformedTag = {
      ...tag,
      posts: tag.posts.map(pt => pt.post),
      tasks: tag.tasks.map(tt => tt.task),
    };

    return NextResponse.json(transformedTag, { status: 200 });
  } catch (error) {
    console.error('Error fetching tag:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении тега' },
      { status: 500 }
    );
  }
}