import { NextResponse } from 'next/server';

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

    const response = await fetch(
      `https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodeURIComponent(filePath)}`,
      {
        headers: { Authorization: `OAuth ${TOKEN}` },
      }
    );

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 500 });
    }

    if (!data.href) {
      return NextResponse.json({ error: 'Не удалось получить ссылку' }, { status: 500 });
    }

    return NextResponse.redirect(data.href);
  } catch (error) {
    const err = error as Error;
    console.error('Ошибка получения ссылки на скачивание:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
