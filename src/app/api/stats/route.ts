import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  format, 
  eachDayOfInterval, 
  eachMonthOfInterval, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  startOfDay,
  endOfDay
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let interval: 'day' | 'month' = 'day';

    // 1. Расчет календарных границ
    if (period === 'week') {
      const tempDate = new Date(now);
      const day = tempDate.getDay(); 
      const diff = tempDate.getDate() - day + (day === 0 ? -6 : 1); 
      startDate = new Date(tempDate.setDate(diff));
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      interval = 'day';
    } else if (period === 'month') {
      startDate = startOfDay(startOfMonth(now));
      endDate = endOfDay(endOfMonth(now));
      interval = 'day';
    } else {
      startDate = startOfDay(startOfYear(now));
      endDate = endOfDay(endOfYear(now));
      interval = 'month';
    }

    // Фильтры (считаем ВСЕ статусы по просьбе пользователя)
    const postFilter = { post_deadline: { gte: startDate, lte: endDate } };
    const taskFilter = { end_time: { gte: startDate, lte: endDate } };

    // 2. Параллельные запросы к БД
    const [
      activePosts,
      completedPosts,
      activeTasks,
      completedTasks,
      overduePosts,
      totalComments,
      confirmedComments,
      complexityData,
      published,
      teamRaw,
      commentsRaw,
      tagsRaw
    ] = await Promise.all([
      prisma.post.count({ where: postFilter }),
      prisma.post.count({ where: { ...postFilter, post_status: 'Завершен' } }),
      prisma.task.count({ where: taskFilter }),
      prisma.task.count({ where: { ...taskFilter, task_status: 'Выполнена' } }),
      // Просроченные — только те, что "В работе" и дедлайн уже прошел
      prisma.post.count({ 
        where: { 
          post_deadline: { gte: startDate, lt: now }, 
          post_status: 'В работе' 
        } 
      }),
      prisma.comment.count({ 
        where: { created_at: { gte: startDate, lte: now } } 
      }),
      prisma.comment.count({ 
        where: { created_at: { gte: startDate, lte: now }, status: 'confirmed' } 
      }),
      prisma.post.findMany({
        where: postFilter,
        select: { 
          post_needs_video: true, post_needs_mini_video_smm: true, post_needs_cover_photo: true,
          post_needs_photo_cards: true, post_needs_photogallery: true, post_needs_mini_gallery: true,
          post_done_link_video: true, post_done_link_mini_video_smm: true, post_done_link_cover_photo: true,
          post_done_link_photo_cards: true, post_done_link_photogallery: true, post_done_link_mini_gallery: true
        }
      }),
      prisma.post.aggregate({
        where: postFilter,
        _count: { telegram_published: true, vkontakte_published: true, MAX_published: true }
      }),
      prisma.user.findMany({
        select: { 
          user_login: true, 
          posts: { where: postFilter, select: { post_id: true } },
          assigned_tasks: { 
            where: { task: taskFilter },
            select: { task_id: true }
          }
        },
        take: 20
      }),
      prisma.comment.findMany({
        where: { created_at: { gte: startDate, lte: now } },
        select: { created_at: true }
      }),
      prisma.tag.findMany({
        select: {
          name: true,
          color: true,
          posts: {
            where: { post: postFilter },
            select: { post_id: true }
          }
        },
        take: 15
      })
    ]);

    // 3. Формирование данных для графиков
    let frictionData: any[] = [];
    const graphEnd = now < endDate ? now : endDate;
    if (interval === 'day') {
      const days = eachDayOfInterval({ start: startDate, end: graphEnd });
      frictionData = days.map(d => ({
        name: format(d, 'dd.MM'),
        value: commentsRaw.filter(c => format(c.created_at, 'dd.MM') === format(d, 'dd.MM')).length
      }));
    } else {
      const months = eachMonthOfInterval({ start: startDate, end: now });
      frictionData = months.map(m => ({
        name: format(m, 'MMM', { locale: ru }),
        value: commentsRaw.filter(c => c.created_at.getMonth() === m.getMonth()).length
      }));
    }

    // 4. Ответ
    return NextResponse.json({
      pulse: { activePosts, completedPosts, activeTasks, completedTasks, overduePosts, totalComments, confirmedComments },
      complexity: [
        { name: 'Видео',        value: complexityData.filter(p => p.post_needs_video).length,              completed: complexityData.filter(p => p.post_needs_video && p.post_done_link_video).length },
        { name: 'SMM Видео',    value: complexityData.filter(p => p.post_needs_mini_video_smm).length,     completed: complexityData.filter(p => p.post_needs_mini_video_smm && p.post_done_link_mini_video_smm).length },
        { name: 'Обложки',      value: complexityData.filter(p => p.post_needs_cover_photo).length,        completed: complexityData.filter(p => p.post_needs_cover_photo && p.post_done_link_cover_photo).length },
        { name: 'Карточки',     value: complexityData.filter(p => p.post_needs_photo_cards).length,        completed: complexityData.filter(p => p.post_needs_photo_cards && p.post_done_link_photo_cards).length },
        { name: 'Галереи',      value: complexityData.filter(p => p.post_needs_photogallery).length,       completed: complexityData.filter(p => p.post_needs_photogallery && p.post_done_link_photogallery).length },
        { name: 'Мини-галереи', value: complexityData.filter(p => p.post_needs_mini_gallery).length,       completed: complexityData.filter(p => p.post_needs_mini_gallery && p.post_done_link_mini_gallery).length },
      ],
      platforms: [
        { name: 'Telegram', value: published._count.telegram_published || 0 },
        { name: 'VK', value: published._count.vkontakte_published || 0 },
        { name: 'MAX', value: published._count.MAX_published || 0 },
      ],
      team: teamRaw.map(u => ({
        login: u.user_login,
        posts: u.posts.length,
        tasks: u.assigned_tasks.length
      })),
      friction: frictionData,
      tags: tagsRaw
        .map(t => ({ name: t.name, color: t.color, count: t.posts.length }))
        .filter(t => t.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    });

  } catch (e: any) {
    console.error('Stats API Error:', e.message);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}