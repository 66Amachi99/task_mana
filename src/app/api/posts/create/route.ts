import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.post_title || !body.post_deadline) {
      return NextResponse.json(
        { error: 'Заполните название и дедлайн поста' },
        { status: 400 }
      );
    }

    const post_deadline = new Date(body.post_deadline);
    
    const data: any = {
      post_title: body.post_title,
      post_deadline: post_deadline,
      tz_link: body.tz_link || null,
      post_status: 'В работе',
      is_published: false,
      telegram_published: null,
      vkontakte_published: null,
      MAX_published: null,
      post_needs_mini_video_smm: body.post_needs_mini_video_smm || false,
      post_needs_video: body.post_needs_video || false,
      post_needs_cover_photo: body.post_needs_cover_photo || false,
      post_needs_photo_cards: body.post_needs_photo_cards || false,
      post_needs_photogallery: body.post_needs_photogallery || false,
      post_needs_mini_gallery: body.post_needs_mini_gallery || false,
      post_needs_text: true,
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

    const post = await prisma.post.create({
      data: data,
    });

    if (body.tag_ids && body.tag_ids.length > 0) {
      await prisma.postTag.createMany({
        data: body.tag_ids.map((tagId: number) => ({
          post_id: post.post_id,
          tag_id: tagId,
        })),
      });
    }

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
