import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { subDays, startOfYear, format, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    let startDate: Date;
    let interval: 'day' | 'month' = 'day';

    if (period === 'week') {
      startDate = subDays(new Date(), 7);
      interval = 'day';
    } else if (period === 'month') {
      startDate = subDays(new Date(), 30);
      interval = 'day';
    } else {
      startDate = startOfYear(new Date());
      interval = 'month';
    }

    const dateFilter = { gte: startDate };

    const [activePosts, activeTasks, overduePosts, totalComments, complexityData, published, teamRaw, commentsRaw, tagsRaw] = await Promise.all([
      prisma.post.count({ where: { created_at: dateFilter, post_status: 'В работе' } }),
      prisma.task.count({ where: { created_at: dateFilter, task_status: 'В работе' } }),
      prisma.post.count({ where: { created_at: dateFilter, post_deadline: { lt: new Date() }, post_status: 'В работе' } }),
      prisma.comment.count({ where: { created_at: dateFilter } }),
      prisma.post.findMany({
        where: { created_at: dateFilter },
        select: { post_needs_video: true, post_needs_mini_video_smm: true, post_needs_cover_photo: true, post_needs_photo_cards: true, post_needs_photogallery: true, post_needs_mini_gallery: true }
      }),
      prisma.post.aggregate({
        where: { created_at: dateFilter },
        _count: { telegram_published: true, vkontakte_published: true, MAX_published: true }
      }),
      prisma.user.findMany({
        select: { user_login: true, _count: { select: { posts: { where: { created_at: dateFilter, post_status: 'В работе' } }, assigned_tasks: { where: { created_at: dateFilter, task: { task_status: 'В работе' } } } } } },
        take: 20
      }),
      prisma.comment.findMany({
        where: { created_at: dateFilter },
        select: { created_at: true }
      }),
      prisma.tag.findMany({
        select: {
          name: true,
          color: true,
          _count: { select: { posts: { where: { post: { created_at: dateFilter } } } } }
        },
        orderBy: { posts: { _count: 'desc' } },
        take: 10
      })
    ]);

    // Friction Data for Recharts
    let frictionData: any[] = [];
    if (interval === 'day') {
      const days = eachDayOfInterval({ start: startDate, end: new Date() });
      frictionData = days.map(d => ({
        name: format(d, 'dd.MM'),
        value: commentsRaw.filter(c => format(c.created_at, 'dd.MM') === format(d, 'dd.MM')).length
      }));
    } else {
      const months = eachMonthOfInterval({ start: startDate, end: new Date() });
      frictionData = months.map(m => ({
        name: format(m, 'MMM', { locale: ru }),
        value: commentsRaw.filter(c => c.created_at.getMonth() === m.getMonth()).length
      }));
    }

    return NextResponse.json({
      pulse: { activePosts, activeTasks, overduePosts, totalComments },
      complexity: [
        { name: 'Видео', value: complexityData.filter(p => p.post_needs_video).length },
        { name: 'SMM Видео', value: complexityData.filter(p => p.post_needs_mini_video_smm).length },
        { name: 'Обложки', value: complexityData.filter(p => p.post_needs_cover_photo).length },
        { name: 'Карточки', value: complexityData.filter(p => p.post_needs_photo_cards).length },
        { name: 'Галереи', value: complexityData.filter(p => p.post_needs_photogallery).length },
        { name: 'Мини-галереи', value: complexityData.filter(p => p.post_needs_mini_gallery).length },
      ],
      // Убеждаемся, что здесь массив объектов
      platforms: [
        { name: 'Telegram', value: published._count.telegram_published || 0 },
        { name: 'VK', value: published._count.vkontakte_published || 0 },
        { name: 'MAX', value: published._count.MAX_published || 0 },
      ],
      team: teamRaw.map(u => ({
        login: u.user_login,
        posts: u._count.posts,
        tasks: u._count.assigned_tasks
      })),
      friction: frictionData,
      tags: tagsRaw
        .filter(t => t._count.posts > 0)
        .map(t => ({ name: t.name, color: t.color, count: t._count.posts }))
    });
  } catch (e) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}