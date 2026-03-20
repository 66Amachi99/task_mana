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

  const uploadPromises = files.map(async (file) => {
    const target = uploadItems.find((item: any) => item.fileName === file.name);
    if (!target) throw new Error(`Не найден URL для ${file.name}`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadRes = await fetch(target.uploadUrl, {
      method: 'PUT',
      body: file,
    });
    if (!uploadRes.ok) throw new Error(`Ошибка загрузки ${file.name}`);
    return target.uploadUrl;
  });

  await Promise.all(uploadPromises);
  return files.map(f => f.name);
}