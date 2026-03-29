import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Таймаут для запросов к Яндекс Диску (10 секунд)
const FETCH_TIMEOUT = 10000;

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

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

    const response = await fetchWithTimeout(
      `https://cloud-api.yandex.net/v1/disk/resources?path=${encodedPath}`,
      {
        method: 'DELETE',
        headers: { Authorization: `OAuth ${TOKEN}` },
      },
      FETCH_TIMEOUT
    );

    if (response.status === 204 || response.status === 202 || response.status === 404) {
      return NextResponse.json({ success: true });
    }

    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Ошибка удаления');
  } catch (error) {
    const err = error as Error;
    if (err.name === 'AbortError') {
      return NextResponse.json({ error: 'Превышено время ожидания ответа от Яндекс Диска' }, { status: 504 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}