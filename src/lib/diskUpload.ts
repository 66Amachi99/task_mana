export async function uploadFilesToYandexDisk(files: File[], folderPath: string): Promise<string[]> {
  const urlRes = await fetch('/api/disk/get-upload-urls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileNames: files.map(f => f.name),
      pathSuffix: folderPath,
    }),
  });
  if (!urlRes.ok) throw new Error('Не удалось получить URL для загрузки');
  const urlData = await urlRes.json();
  const uploadItems = urlData.results;

  // 2. Загружаем каждый файл
  const uploadPromises = files.map(async (file) => {
    const target = uploadItems.find((item: any) => item.fileName === file.name);
    if (!target) throw new Error(`Не найден URL для ${file.name}`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer); // В Node.js среде (серверный API) нужно использовать Buffer, но у нас клиент, поэтому fetch с FormData? Нет, здесь мы на клиенте, но мы делаем запрос к нашему API, который потом сам загружает? Нет, мы используем прямую загрузку с клиента. Значит, нужно использовать XMLHttpRequest или fetch с телом arrayBuffer. Но наш API `/api/disk/get-upload-urls` возвращает прямые URL для загрузки на Яндекс.Диск, поэтому мы можем загружать прямо с клиента. Однако в этом файле мы пишем клиентскую утилиту, поэтому нужно использовать fetch с телом.

    const uploadRes = await fetch(target.uploadUrl, {
      method: 'PUT',
      body: file, // можно передать сам File, он уже ArrayBuffer-like
    });
    if (!uploadRes.ok) throw new Error(`Ошибка загрузки ${file.name}`);
    return target.uploadUrl; // или что-то другое
  });

  await Promise.all(uploadPromises);
  return files.map(f => f.name); // или возвращаем пути к файлам
}