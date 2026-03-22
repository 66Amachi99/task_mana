import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { fromPath, toPath } = await req.json();
    const TOKEN = process.env.DISK_TOKEN;

    if (!TOKEN) {
      return NextResponse.json({ error: 'Токен Яндекс.Диска не настроен' }, { status: 500 });
    }

    if (!fromPath || !toPath) {
      return NextResponse.json({ error: 'Не указаны пути для перемещения' }, { status: 400 });
    }

    const encodedFrom = encodeURIComponent(fromPath);
    const encodedTo = encodeURIComponent(toPath);

    // Проверяем, существует ли исходная папка
    const checkRes = await fetch(
      `https://cloud-api.yandex.net/v1/disk/resources?path=${encodedFrom}`,
      {
        headers: { Authorization: `OAuth ${TOKEN}` },
      }
    );

    if (!checkRes.ok) {
      const checkData = await checkRes.json();
      if (checkData.error === 'DiskNotFoundError') {
        // Исходная папка не существует - ничего перемещать не нужно
        return NextResponse.json({ success: true, moved: false, reason: 'source_not_found' });
      }
      return NextResponse.json({ error: `Ошибка проверки папки: ${checkData.message}` }, { status: 500 });
    }

    // Перемещаем папку
    const moveRes = await fetch(
      `https://cloud-api.yandex.net/v1/disk/resources/move?from=${encodedFrom}&path=${encodedTo}&overwrite=true`,
      {
        method: 'POST',
        headers: { Authorization: `OAuth ${TOKEN}` },
      }
    );

    if (moveRes.status === 201 || moveRes.status === 202) {
      return NextResponse.json({ success: true, moved: true });
    }

    const moveData = await moveRes.json();
    
    // Если папка уже существует по новому пути
    if (moveData.error === 'DiskPathPointsToExistentDirectoryError') {
      return NextResponse.json({ success: true, moved: false, reason: 'already_exists' });
    }

    throw new Error(moveData.message || 'Ошибка перемещения папки');
  } catch (error) {
    const err = error as Error;
    console.error('Ошибка перемещения папки:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
