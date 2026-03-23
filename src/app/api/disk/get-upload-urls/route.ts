import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  'pcx','dcx','wmf','emf','wpg','bpg','eprn','prm','ppm','pgm','pbm','pix','pct','pic','dib','psd','tiff','rpng','jif','vst','tga','bmp','jpg','apng','jpeg','heic','png','eps','webp','svgz','gif','svg','heif','prn','icns','xpm','abrn','tif','blk','avif',
]);

const MAX_FILES_PER_REQUEST = 20;

function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() || '' : '';
}

function isAllowedImageFileName(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return ALLOWED_IMAGE_EXTENSIONS.has(ext);
}

function isSafeFileName(fileName: string): boolean {
  if (!fileName || typeof fileName !== 'string') return false;
  const trimmed = fileName.trim();
  if (!trimmed) return false;
  if (trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('..')) return false;
  return true;
}

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

    if (!Array.isArray(fileNames) || fileNames.length === 0) {
      return NextResponse.json({ error: 'Список файлов пуст или некорректен' }, { status: 400 });
    }

    if (fileNames.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Слишком много файлов за один запрос. Максимум: ${MAX_FILES_PER_REQUEST}` },
        { status: 400 }
      );
    }

    if (!pathSuffix || typeof pathSuffix !== 'string') {
      return NextResponse.json({ error: 'Некорректный путь папки' }, { status: 400 });
    }

    const invalidNames = fileNames.filter((name: unknown) => !isSafeFileName(String(name)));
    if (invalidNames.length > 0) {
      return NextResponse.json(
        { error: `Некорректные имена файлов: ${invalidNames.join(', ')}` },
        { status: 400 }
      );
    }

    const disallowedFiles = fileNames.filter((name: unknown) => {
      const fileName = String(name);
      return !isAllowedImageFileName(fileName);
    });

    if (disallowedFiles.length > 0) {
      return NextResponse.json(
        {
          error: `Разрешена загрузка только изображений допустимых форматов. Отклонены: ${disallowedFiles.join(', ')}`,
        },
        { status: 400 }
      );
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

      if (!res.ok || !data?.href) {
        throw new Error(data?.message || `Не удалось получить upload URL для файла ${name}`);
      }

      return { fileName: name, uploadUrl: data.href };
    });

    const results = await Promise.all(urlPromises);
    return NextResponse.json({ results });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}