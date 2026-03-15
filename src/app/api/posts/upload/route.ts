import {NextResponse} from "next/server";

async function ensurePathExists(fullPath: string, token: string) {
    const parts = fullPath.split('/').filter(Boolean);
    let currentPath = "";

    for (const part of parts) {

        const encodedPart = encodeURIComponent(part)
        currentPath += `/${encodedPart}`;
        console.log(currentPath)

        // Пробуем создать каждую папку в цепочке
        const res = await fetch(
            `https://cloud-api.yandex.net/v1/disk/resources?path=${currentPath}`,
            {
                method: 'PUT',
                headers: { Authorization: `OAuth ${token}` }
            }
        );

        if (res.status !== 201 && res.status !== 409) {
            const data = await res.json();
            // Если ошибка не 409, тогда действительно что-то не так (например, кончилось место)
            throw new Error(`Ошибка создания папки ${currentPath}: ${data.message}`);
        } else {
            console.log(res.status)
        }

        // Мы игнорируем ошибки (например, 409 - папка уже есть),
        // так как нам важен только результат: папка существует в итоге.
    }
}


export async function POST (req: Request) {
    try {
        const formData = await req.formData()
        const files = formData.getAll('files') as File[]
        const pathSuffix = (formData.get('path') as string).replace(/"/g, '')
        const TOKEN = process.env['DISK_TOKEN']

        if (!TOKEN) return

        const baseFolder = `/taskmanager/${pathSuffix}`;
        await ensurePathExists(baseFolder, TOKEN);



        if (!files.length) return NextResponse.json({error: 'Пусто'}, {status: 400})

        const uploadPromises = files.map(async file => {
            const fileName = encodeURIComponent(file.name)
            // const encodedBase = encodeURIComponent(baseFolder)
            const diskPath = `${baseFolder}/${fileName}`
            console.log(diskPath)

            const getHref = await fetch(
                `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${diskPath}&overwrite=true`, {
                    headers: {Authorization: `OAuth ${TOKEN}` }
                }
            )
            const { href } = await getHref.json()

            if (!href) throw new Error(`Нет ссылки для ${fileName}`)

            return fetch(href, {
                method: 'PUT',
                body: Buffer.from(await file.arrayBuffer())
            })
        })

        // Ждем, пока все загрузки завершатся
        const results = await Promise.all(uploadPromises);
        const allOk = results.every(res => res.ok);

        return allOk
            ? NextResponse.json({ success: true })
            : NextResponse.json({ error: 'Часть файлов не загрузилась' }, { status: 207 });

    } catch (error) {
        const err = error as Error;
        return NextResponse.json({error: err.message}, { status: 500 })
    }
}

// export const config = {
//     api: {
//         bodyParser: false, // Отключаем стандартный парсер для больших данных
//     },
// };