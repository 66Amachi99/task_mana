import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { path } = await req.json();
    const TOKEN = process.env.DISK_TOKEN;

    if (!TOKEN) {
      return NextResponse.json({ error: 'Токен Яндекс Диска не настроен' }, { status: 500 });
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
      return NextResponse.json({ result: [] });
    }

    const items = list._embedded?.items || [];
    const files = items
      .filter((item: any) => item.type === 'file')
      .map((item: any) => ({
        fileName: item.name,
        path: item.path,
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
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}