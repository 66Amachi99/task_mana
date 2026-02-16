import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const totalPosts = await prisma.post.count();
    const totalPages = Math.ceil(totalPosts / limit);

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
      skip: skip,
      take: limit,
    });
    
    const serializedPosts = posts.map(post => ({
      ...post,
      post_date: post.post_date ? post.post_date.toISOString() : null,
      post_deadline: post.post_deadline.toISOString(),
    }));
    
    return NextResponse.json({
      posts: serializedPosts,
      currentPage: page,
      totalPages,
      totalPosts,
    }, { status: 200 });
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

    console.log('Получен запрос на создание поста:', body);

    if (!body.post_title || !body.post_type || !body.post_deadline) {
      return NextResponse.json(
        { error: 'Заполните название, тип и дедлайн поста' },
        { status: 400 }
      );
    }

    const post_deadline = new Date(body.post_deadline);
    
    const data: any = {
      post_title: body.post_title,
      post_type: body.post_type,
      post_deadline: post_deadline,
      post_needs_video_smm: body.post_needs_video_smm || false,
      post_needs_video_maker: body.post_needs_video_maker || false,
      post_needs_text: body.post_needs_text || false,
      post_needs_photogallery: body.post_needs_photogallery || false,
      post_needs_cover_photo: body.post_needs_cover_photo || false,
      post_needs_photo_cards: body.post_needs_photo_cards || false,
    };

    if (body.post_description !== undefined && body.post_description !== null) {
      data.post_description = body.post_description;
    }

    if (body.responsible_person_id && body.responsible_person_id !== '') {
      const id = parseInt(body.responsible_person_id);
      if (!isNaN(id)) {
        data.responsible_person_id = id;
      }
    }

    console.log('📤 Отправляем в БД:', data);

    const post = await prisma.post.create({
      data: data,
    });

    return NextResponse.json(
      { success: true, post },
      { status: 201 }
    );

  } catch (error) {
    console.error('Ошибка при создании поста:', error);
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

    const existingPost = await prisma.post.findUnique({
      where: { post_id: Number(postId) }
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Пост не найден' },
        { status: 404 }
      );
    }

    if (links && Object.keys(links).length > 0) {
      const updateData: any = {};

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

    } else if (data && Object.keys(data).length > 0) {
      const { post_deadline, ...otherData } = data;
      
      const updateData: any = {
        ...otherData,
      };

      if (post_deadline) {
        updateData.post_deadline = new Date(post_deadline);
      }

      if (otherData.responsible_person_id !== undefined) {
        if (otherData.responsible_person_id && otherData.responsible_person_id !== '') {
          const id = parseInt(otherData.responsible_person_id);
          if (!isNaN(id)) {
            updateData.responsible_person_id = id;
          } else {
            updateData.responsible_person_id = null;
          }
        } else {
          updateData.responsible_person_id = null;
        }
      }

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