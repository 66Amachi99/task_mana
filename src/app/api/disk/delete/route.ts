import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { path } = await req.json();
    const TOKEN = process.env.DISK_TOKEN;

    if (!TOKEN) {
      return NextResponse.json({ error: 'Токен Яндекс.Диска не настроен' }, { status: 500 });
    }

    const encodedPath = encodeURIComponent(path);

    const response = await fetch(
      `https://cloud-api.yandex.net/v1/disk/resources?path=${encodedPath}`,
      {
        method: 'DELETE',
        headers: { Authorization: `OAuth ${TOKEN}` },
      }
    );

    if (response.status === 204 || response.status === 202 || response.status === 404) {
      return NextResponse.json({ success: true });
    }

    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Ошибка удаления');
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}