import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface ListItem {
  taskId: number;
  folderPath: string;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { items } = await req.json() as { items: ListItem[] };
    const TOKEN = process.env.DISK_TOKEN;

    if (!TOKEN) {
      return NextResponse.json({ error: 'Токен Яндекс.Диска не настроен' }, { status: 500 });
    }

    const results = await Promise.all(
      items.map(async ({ taskId, folderPath }) => {
        const wholePath = `/taskmanager/${encodeURIComponent(folderPath)}`;
        try {
          const getList = await fetch(
            `https://cloud-api.yandex.net/v1/disk/resources?path=${wholePath}&limit=100`,
            {
              headers: { Authorization: `OAuth ${TOKEN}` },
            }
          );
          const list = await getList.json();

          if (list.error) {
            return { taskId, files: [] };
          }

          const items = list._embedded?.items || [];
          const files = items
            .filter((item: any) => item.type === 'file')
            .map((item: any) => ({
              fileName: item.name,
              path: item.path,
              sizes: item.sizes || [],
            }));

          return { taskId, files };
        } catch (error) {
          console.error(`Ошибка получения файлов для задачи ${taskId}:`, error);
          return { taskId, files: [] };
        }
      })
    );

    const filesMap: Record<number, any[]> = {};
    results.forEach(({ taskId, files }) => {
      filesMap[taskId] = files;
    });

    return NextResponse.json({ filesMap });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}