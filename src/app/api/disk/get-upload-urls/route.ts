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

    const { fileNames, pathSuffix } = await req.json();
    const TOKEN = process.env.DISK_TOKEN;

    if (!TOKEN) {
      return NextResponse.json({ error: 'Токен Яндекс.Диска не настроен' }, { status: 500 });
    }

    const baseFolder = `/taskmanager/${pathSuffix}`;
    await ensurePathExists(baseFolder, TOKEN);

    const urlPromises = fileNames.map(async (name: string) => {
      const fileName = encodeURIComponent(name);
      const diskPath = `${baseFolder}/${fileName}`;

      const res = await fetch(
        `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${diskPath}&overwrite=true`,
        {
          headers: { Authorization: `OAuth ${TOKEN}` },
        }
      );
      const data = await res.json();
      return { fileName: name, uploadUrl: data.href };
    });

    const results = await Promise.all(urlPromises);
    return NextResponse.json({ results });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}