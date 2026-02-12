import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Добавляем GET запрос для получения постов
export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            user_login: true,
          },
        },
      },
      orderBy: {
        post_date: 'desc',
      },
      take: 10,
    });
    
    // Преобразуем Date объекты в строки для сериализации
    const serializedPosts = posts.map(post => ({
      ...post,
      post_date: post.post_date ? new Date(post.post_date) : null,
      post_deadline: new Date(post.post_deadline),
    }));
    
    return NextResponse.json(serializedPosts, { status: 200 });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении постов' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Валидация данных
    if (!body.post_title || !body.post_description || !body.post_type || !body.post_deadline) {
      return NextResponse.json(
        { error: 'Все обязательные поля должны быть заполнены' },
        { status: 400 }
      );
    }

    // Преобразуем строку дедлайна в объект Date
    const post_deadline = new Date(body.post_deadline);
    
    // Создаем пост в базе данных
    const post = await prisma.post.create({
      data: {
        post_title: body.post_title,
        post_description: body.post_description,
        post_type: body.post_type,
        post_status: body.post_status || 'Ожидает начала',
        post_deadline: post_deadline,
        post_needs_video_smm: body.post_needs_video_smm || false,
        post_needs_video_maker: body.post_needs_video_maker || false,
        post_needs_text: body.post_needs_text || false,
        post_needs_photogallery: body.post_needs_photogallery || false,
        post_needs_cover_photo: body.post_needs_cover_photo || false,
        post_needs_photo_cards: body.post_needs_photo_cards || false,
      },
    });

    return NextResponse.json(
      { success: true, post },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating post:', error);
    
    return NextResponse.json(
      { error: 'Ошибка при создании поста' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, links, data } = body;

    if (!postId) {
      return NextResponse.json(
        { error: 'Не указан ID поста' },
        { status: 400 }
      );
    }

    // Проверяем, что это запрос на обновление ссылок или данных поста
    if (links) {
      // Обновление ссылок
      const updateData: any = {};

      // Обновляем только те поля, которые есть в links
      if (links.video_smm !== undefined) {
        updateData.post_done_link_video_smm = links.video_smm || null;
      }
      if (links.video_maker !== undefined) {
        updateData.post_done_link_video_maker = links.video_maker || null;
      }
      if (links.text !== undefined) {
        updateData.post_done_link_text = links.text || null;
      }
      if (links.photogallery !== undefined) {
        updateData.post_done_link_photogallery = links.photogallery || null;
      }
      if (links.cover_photo !== undefined) {
        updateData.post_done_link_cover_photo = links.cover_photo || null;
      }
      if (links.photo_cards !== undefined) {
        updateData.post_done_link_photo_cards = links.photo_cards || null;
      }

      const updatedPost = await prisma.post.update({
        where: { post_id: Number(postId) },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: 'Ссылки успешно сохранены',
        post: updatedPost,
      }, { status: 200 });

    } else if (data) {
      // Обновление данных поста
      const { post_deadline, ...otherData } = data;
      
      const updateData: any = {
        ...otherData,
        post_deadline: new Date(post_deadline),
      };

      // Обновляем пост
      const updatedPost = await prisma.post.update({
        where: { post_id: Number(postId) },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: 'Пост успешно обновлен',
        post: updatedPost,
      }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: 'Не указаны данные для обновления' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Ошибка при обновлении:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении данных' },
      { status: 500 }
    );
  }
}

// Добавляем обработку DELETE если нужно
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json(
        { error: 'Не указан ID поста' },
        { status: 400 }
      );
    }

    await prisma.post.delete({
      where: { post_id: Number(postId) },
    });

    return NextResponse.json(
      { success: true, message: 'Пост успешно удален' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении поста' },
      { status: 500 }
    );
  }
}