import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const postId = searchParams.get('id');

    // --- НОВЫЕ ПАРАМЕТРЫ ---
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sort = searchParams.get('sort') || 'asc'; 
    // -----------------------

    if (postId) {
      const post = await prisma.post.findUnique({
        where: { post_id: Number(postId) },
        include: {
          user: {
            select: {
              user_login: true,
            },
          },
          approved_by: {
            select: {
              user_login: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          comments: {
            orderBy: {
              created_at: 'desc',
            },
            include: {
              created_by: {
                select: {
                  user_id: true,
                  user_login: true,
                },
              },
            },
          },
        },
      });

      if (!post) {
        return NextResponse.json(
          { error: 'Пост не найден' },
          { status: 404 }
        );
      }

      const transformedPost = {
        ...post,
        tags: post.tags.map(pt => pt.tag),
        post_date: post.post_date ? post.post_date.toISOString() : null,
        post_deadline: post.post_deadline.toISOString(),
      };

      return NextResponse.json({ posts: [transformedPost] }, { status: 200 });
    }

    // --- ИЗМЕНЕННЫЙ БЛОК WHERE ---
    const where: any = {};
    if (startDate || endDate) {
      where.post_deadline = {};
      if (startDate) where.post_deadline.gte = new Date(startDate);
      if (endDate) where.post_deadline.lte = new Date(endDate);
    }
    // ----------------------------

    const totalPosts = await prisma.post.count({ where }); // Добавил where в подсчет
    const totalPages = Math.ceil(totalPosts / limit);

    const posts = await prisma.post.findMany({
      where, // Применяем фильтр
      include: {
        user: {
          select: {
            user_login: true,
          },
        },
        approved_by: {
          select: {
            user_login: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        comments: {
          orderBy: {
            created_at: 'desc',
          },
          include: {
            created_by: {
              select: {
                user_id: true,
                user_login: true,
              },
            },
          },
        },
      },
      // --- ИЗМЕНЕННАЯ СОРТИРОВКА ---
      orderBy: {
        post_deadline: sort as 'asc' | 'desc',
      },
      // ----------------------------
      skip: skip,
      take: limit,
    });

    const transformedPosts = posts.map(post => ({
      ...post,
      tags: post.tags.map(pt => pt.tag),
      post_date: post.post_date ? post.post_date.toISOString() : null,
      post_deadline: post.post_deadline.toISOString(),
    }));

    return NextResponse.json({
      posts: transformedPosts,
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