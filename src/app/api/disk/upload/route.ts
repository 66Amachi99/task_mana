import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function ensurePathExists(fullPath: string, token: string) {
  const parts = fullPath.split('/').filter(Boolean);
  let currentPath = '';

  for (const part of parts) {
    const encodedPart = encodeURIComponent(part);
    currentPath += `/${encodedPart}`;

    const res = await fetch(
      `https://cloud-api.yandex.net/v1/disk/resources?path=${currentPath}`,
      {
        method: 'PUT',
        headers: { Authorization: `OAuth ${token}` },
      }
    );

    if (res.status !== 201 && res.status !== 409) {
      const data = await res.json();
      throw new Error(`Ошибка создания папки ${currentPath}: ${data.message}`);
    }
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const pathSuffix = (formData.get('path') as string) || '';
    const TOKEN = process.env.DISK_TOKEN;

    if (!TOKEN) {
      return NextResponse.json({ error: 'Токен Яндекс.Диска не настроен' }, { status: 500 });
    }

    const baseFolder = `/taskmanager/${pathSuffix}`;
    await ensurePathExists(baseFolder, TOKEN);

    if (!files.length) {
      return NextResponse.json({ error: 'Пусто' }, { status: 400 });
    }

    const uploadPromises = files.map(async (file) => {
      const fileName = encodeURIComponent(file.name);
      const diskPath = `${baseFolder}/${fileName}`;

      const getHref = await fetch(
        `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${diskPath}&overwrite=true`,
        {
          headers: { Authorization: `OAuth ${TOKEN}` },
        }
      );
      const { href } = await getHref.json();

      if (!href) throw new Error(`Нет ссылки для ${fileName}`);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadRes = await fetch(href, {
        method: 'PUT',
        body: buffer,
      });

      return uploadRes.ok;
    });

    const results = await Promise.all(uploadPromises);
    const allOk = results.every(Boolean);

    return allOk
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: 'Часть файлов не загрузилась' }, { status: 207 });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}