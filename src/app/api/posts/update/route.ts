import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const checkAllTasksCompleted = (post: any): boolean => {
  return (
    (!post.post_needs_mini_video_smm || post.post_done_link_mini_video_smm) &&
    (!post.post_needs_video || post.post_done_link_video) &&
    (!post.post_needs_text || post.post_done_link_text) &&
    (!post.post_needs_photogallery || post.post_done_link_photogallery) &&
    (!post.post_needs_cover_photo || post.post_done_link_cover_photo) &&
    (!post.post_needs_photo_cards || post.post_done_link_photo_cards) &&
    (!post.post_needs_mini_gallery || post.post_done_link_mini_gallery)
  );
};

const TASK_TYPE_IDS = {
  mini_video_smm: 1,
  video: 2,
  text: 3,
  photogallery: 4,
  cover_photo: 5,
  photo_cards: 6,
  mini_gallery: 7,
};

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, action, social, link } = body;

    if (!postId) {
      return NextResponse.json(
        { error: 'Не указан ID поста' },
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

    const userData = session.user as any;
    const userId = parseInt(userData.id);

    const existingPost = await prisma.post.findUnique({
      where: { post_id: Number(postId) }
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Пост не найден' },
        { status: 404 }
      );
    }

    let updateData: any = {};

    if (action === 'approve') {
      const allTasksCompleted = checkAllTasksCompleted(existingPost);

      if (!allTasksCompleted) {
        return NextResponse.json(
          { error: 'Не все задачи выполнены' },
          { status: 400 }
        );
      }

      updateData.approved_by_id = userId;
    }
    else if (action === 'unapprove') {
      const canUnapprove = userData.admin_role || userData.coordinator_role;
      if (!canUnapprove) {
        return NextResponse.json(
          { error: 'Недостаточно прав для снятия согласования' },
          { status: 403 }
        );
      }
      updateData.approved_by_id = null;
    }
    else if (action === 'publish') {
      updateData.is_published = true;
    }
    else if (action === 'unpublish') {
      updateData.is_published = false;
    }
    else if (action === 'add_social_link') {
      if (!social || !link) {
        return NextResponse.json(
          { error: 'Не указана соцсеть или ссылка' },
          { status: 400 }
        );
      }

      switch (social) {
        case 'telegram':
          updateData.telegram_published = link;
          break;
        case 'vkontakte':
          updateData.vkontakte_published = link;
          break;
        case 'max':
          updateData.MAX_published = link;
          break;
        default:
          return NextResponse.json(
            { error: 'Неизвестная соцсеть' },
            { status: 400 }
          );
      }
    }
    else if (action === 'remove_social_link') {
      if (!social) {
        return NextResponse.json(
          { error: 'Не указана соцсеть' },
          { status: 400 }
        );
      }

      switch (social) {
        case 'telegram':
          updateData.telegram_published = null;
          break;
        case 'vkontakte':
          updateData.vkontakte_published = null;
          break;
        case 'max':
          updateData.MAX_published = null;
          break;
        default:
          return NextResponse.json(
            { error: 'Неизвестная соцсеть' },
            { status: 400 }
          );
      }
    }
    else {
      return NextResponse.json(
        { error: 'Неизвестное действие' },
        { status: 400 }
      );
    }

    const updatedPost = await prisma.post.update({
      where: { post_id: Number(postId) },
      data: updateData,
      include: {
        approved_by: {
          select: { user_login: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Статус обновлен',
      post: updatedPost,
    }, { status: 200 });

  } catch (error) {
    console.error('Ошибка при обновлении:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении данных' },
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

      if (links.mini_video_smm !== undefined) {
        updateData.post_done_link_mini_video_smm = links.mini_video_smm || null;
      }
      if (links.video !== undefined) {
        updateData.post_done_link_video = links.video || null;
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
      if (links.mini_gallery !== undefined) {
        updateData.post_done_link_mini_gallery = links.mini_gallery || null;
      }

      const updatedPost = await prisma.post.update({
        where: { post_id: Number(postId) },
        data: updateData,
      });

      const allTasksCompleted = checkAllTasksCompleted({
        ...existingPost,
        ...updatedPost,
        ...updateData
      });

      if (allTasksCompleted && updatedPost.post_status !== 'Завершен') {
        await prisma.post.update({
          where: { post_id: Number(postId) },
          data: { post_status: 'Завершен' },
        });
      } 
      else if (!allTasksCompleted && updatedPost.post_status === 'Завершен') {
        await prisma.post.update({
          where: { post_id: Number(postId) },
          data: { post_status: 'В работе' },
        });
      }

      const finalPost = await prisma.post.findUnique({
        where: { post_id: Number(postId) },
        include: {
          approved_by: {
            select: { user_login: true }
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Ссылки успешно сохранены',
        post: finalPost,
      }, { status: 200 });

    } 
    else if (data && Object.keys(data).length > 0) {
      const { post_deadline, tag_ids, ...otherData } = data;
      
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

      if (existingPost.approved_by_id) {
        updateData.approved_by_id = null;
      }

      const updatedPost = await prisma.post.update({
        where: { post_id: Number(postId) },
        data: updateData,
      });

      if (tag_ids && Array.isArray(tag_ids)) {
        await prisma.postTag.deleteMany({
          where: { post_id: Number(postId) },
        });

        if (tag_ids.length > 0) {
          await prisma.postTag.createMany({
            data: tag_ids.map((tagId: number) => ({
              post_id: Number(postId),
              tag_id: tagId,
            })),
          });
        }
      }

      const postAfterUpdate = await prisma.post.findUnique({
        where: { post_id: Number(postId) }
      });

      if (postAfterUpdate) {
        const allTasksCompleted = checkAllTasksCompleted(postAfterUpdate);
        
        if (allTasksCompleted && postAfterUpdate.post_status !== 'Завершен') {
          await prisma.post.update({
            where: { post_id: Number(postId) },
            data: { post_status: 'Завершен' },
          });
        } 
        else if (!allTasksCompleted && postAfterUpdate.post_status === 'Завершен') {
          await prisma.post.update({
            where: { post_id: Number(postId) },
            data: { post_status: 'В работе' },
          });
        }
      }

      const finalPost = await prisma.post.findUnique({
        where: { post_id: Number(postId) },
        include: {
          approved_by: {
            select: { user_login: true }
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Пост успешно обновлен',
        post: finalPost,
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