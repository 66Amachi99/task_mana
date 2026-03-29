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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');
    const TOKEN = process.env.DISK_TOKEN;

    if (!TOKEN) {
      return NextResponse.json({ error: 'Токен Яндекс Диска не настроен' }, { status: 500 });
    }

    if (!filePath) {
      return NextResponse.json({ error: 'Путь к файлу не указан' }, { status: 400 });
    }

    const response = await fetchWithTimeout(
      `https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodeURIComponent(filePath)}`,
      {
        headers: { Authorization: `OAuth ${TOKEN}` },
      },
      FETCH_TIMEOUT
    );

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 500 });
    }

    if (!data.href) {
      return NextResponse.json({ error: 'Не удалось получить ссылку' }, { status: 500 });
    }

    // Возвращаем URL напрямую клиенту для открытия в новом окне/вкладке
    // Это избегает проблем с редиректами и CORS
    return NextResponse.json({ 
      downloadUrl: data.href,
      fileName: filePath.split('/').pop() || 'file'
    });
  } catch (error) {
    const err = error as Error;
    if (err.name === 'AbortError') {
      return NextResponse.json({ error: 'Превышено время ожидания ответа от Яндекс Диска' }, { status: 504 });
    }
    console.error('Ошибка получения ссылки на скачивание:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
