import { NextResponse } from 'next/server';

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
    const { path } = await req.json();
    const TOKEN = process.env.DISK_TOKEN;

    if (!TOKEN) {
      return NextResponse.json({ error: 'Токен Яндекс Диска не настроен' }, { status: 500 });
    }

    // Кодируем каждый сегмент пути отдельно, сохраняя слеши
    const pathSegments = path.split('/').map((segment: string) => encodeURIComponent(segment)).join('/');
    const wholePath = `/taskmanager/${pathSegments}`;

    const getList = await fetchWithTimeout(
      `https://cloud-api.yandex.net/v1/disk/resources?path=${wholePath}&limit=100`,
      {
        headers: { Authorization: `OAuth ${TOKEN}` },
      },
      FETCH_TIMEOUT
    );

    const list = await getList.json();

    if (list.error) {
      return NextResponse.json({ result: [] });
    }

    const items = list._embedded?.items || [];
    const files = items
      .filter((item: any) => item.type === 'file')
      .map((item: any) => ({
        fileName: item.name,
        path: item.path,
        fileUrl: item.file || null, // Прямая ссылка на файл от Яндекс Диска
        created: item.created,
        modified: item.modified,
      }))
      .sort((a: any, b: any) => {
        const dateA = new Date(a.created || a.modified || 0).getTime();
        const dateB = new Date(b.created || b.modified || 0).getTime();
        return dateA - dateB;
      });

    return NextResponse.json({ result: files });
  } catch (error) {
    const err = error as Error;
    if (err.name === 'AbortError') {
      return NextResponse.json({ error: 'Превышено время ожидания ответа от Яндекс Диска' }, { status: 504 });
    }
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}