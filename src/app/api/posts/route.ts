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
      },
      orderBy: {
        post_date: 'desc',
      },
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
