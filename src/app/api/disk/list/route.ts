import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { path } = await req.json(); // path без /taskmanager/
    const TOKEN = process.env.DISK_TOKEN;

    if (!TOKEN) {
      return NextResponse.json({ error: 'Токен Яндекс.Диска не настроен' }, { status: 500 });
    }

    const wholePath = `/taskmanager/${encodeURIComponent(path)}`;

    const getList = await fetch(
      `https://cloud-api.yandex.net/v1/disk/resources?path=${wholePath}&limit=100`,
      {
        headers: { Authorization: `OAuth ${TOKEN}` },
      }
    );

    const list = await getList.json();

    if (list.error) {
      // Папка не существует
      return NextResponse.json({ files: [] });
    }

    const items = list._embedded?.items || [];
    const files = items
      .filter((item: any) => item.type === 'file')
      .map((item: any) => ({
        fileName: item.name,
        path: item.path,
        sizes: item.sizes || [], // массив размеров с URL превью
      }));

    return NextResponse.json({ files });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}