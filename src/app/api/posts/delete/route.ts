import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

function transliterate(text: string): string {
  const map: Record<string, string> = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh',
    'з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o',
    'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts',
    'ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
    'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'E','Ж':'Zh',
    'З':'Z','И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O',
    'П':'P','Р':'R','С':'S','Т':'T','У':'U','Ф':'F','Х':'H','Ц':'Ts',
    'Ч':'Ch','Ш':'Sh','Щ':'Sch','Ъ':'','Ы':'Y','Ь':'','Э':'E','Ю':'Yu','Я':'Ya',
  };

  return text.split('').map(c => map[c] || c).join('');
}

function slugifyPostTitle(title: string): string {
  return transliterate(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '_');
}

function buildFolderPath(title: string, deadline: Date, postId: number): string {
  const dateStr = format(deadline, 'dd.MM.yyyy', { locale: ru });
  return `posts/${dateStr}_${slugifyPostTitle(title)}_${postId}`;
}

async function deleteFolderFromDisk(path: string) {
  const TOKEN = process.env.DISK_TOKEN;

  if (!TOKEN) {
    throw new Error('Токен Яндекс.Диска не настроен');
  }

  const encodedPath = encodeURIComponent(`/taskmanager/${path}`);

  const response = await fetch(
    `https://cloud-api.yandex.net/v1/disk/resources?path=${encodedPath}&permanently=true`,
    {
      method: 'DELETE',
      headers: { Authorization: `OAuth ${TOKEN}` },
    }
  );

  if (response.status === 204 || response.status === 202) {
    return;
  }

  if (response.status === 404) {
    return;
  }

  const errorData = await response.json().catch(() => null);
  throw new Error(errorData?.message || 'Ошибка удаления папки на Яндекс.Диске');
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

    const numericPostId = Number(postId);

    const post = await prisma.post.findUnique({
      where: { post_id: numericPostId },
      select: {
        post_id: true,
        post_title: true,
        post_deadline: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Пост не найден' },
        { status: 404 }
      );
    }

    const folderPath = buildFolderPath(
      post.post_title,
      new Date(post.post_deadline),
      post.post_id
    );

    await deleteFolderFromDisk(folderPath);

    await prisma.post.delete({
      where: { post_id: numericPostId },
    });

    return NextResponse.json(
      { success: true, message: 'Пост и папка на диске успешно удалены', folderPath },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка при удалении поста' },
      { status: 500 }
    );
  }
}