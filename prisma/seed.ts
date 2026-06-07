import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import {
  addDays, subDays, setHours, setMinutes,
  eachDayOfInterval, format, startOfMonth, endOfMonth,
} from 'date-fns';

const COLORS = [
  '#F7ADC440', '#48C88460', '#AB48BF60', '#FE4D3D40', '#44962740', '#41A5F340'
];

const COMMENT_STATUSES = ['new', 'completed', 'confirmed'];

// Расширенный список ключевых слов для файловых задач
const FILE_TASK_KEYWORDS = [
  'фото', 'обложк', 'галере', 'карточк', 'изображен', 'снимок',
  'дизайн', 'иллюстрац', 'график', 'рисунок', 'фотограф'
];

function isFileTask(title: string): boolean {
  const lower = title.toLowerCase();
  return FILE_TASK_KEYWORDS.some(kw => lower.includes(kw));
}

function randomContentFlags() {
  return {
    post_needs_mini_video_smm: Math.random() > 0.6,
    post_needs_video: Math.random() > 0.8,
    post_needs_cover_photo: Math.random() > 0.3,
    post_needs_photo_cards: Math.random() > 0.5,
    post_needs_photogallery: Math.random() > 0.7,
    post_needs_mini_gallery: Math.random() > 0.6,
    post_needs_text: true,
  };
}

async function main() {
  console.log('🚀 Запуск сида для трёх месяцев (май–июль 2026)...');

  // 1. Очистка
  await prisma.comment.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.taskTag.deleteMany();
  await prisma.taskAssignee.deleteMany();
  await prisma.task.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  // 2. Пользователи
  const usersData = [
    { user_login: 'admin', admin_role: true },
    { user_login: 'smm_head', SMM_role: true },
    { user_login: 'designer_1', designer_role: true },
    { user_login: 'designer_2', designer_role: true },
    { user_login: 'photog', photographer_role: true },
    { user_login: 'coord', coordinator_role: true },
  ];
  const users = [];
  for (const u of usersData) {
    users.push(await prisma.user.create({ data: { ...u, user_password: '123' } }));
  }

  // 3. Теги
  const tagNames = ['Новости', 'Промо', 'Срочно', 'SMM', 'Кейс', 'Важное'];
  const tags = [];
  for (let i = 0; i < tagNames.length; i++) {
    tags.push(await prisma.tag.create({ data: { name: tagNames[i], color: COLORS[i % COLORS.length] } }));
  }

  // 4. Параметры
  const months = [5, 6, 7];
  const year = 2026;
  const POSTS_PER_MONTH = 30;

  const allPosts: any[] = [];
  const postTaskMap: Map<number, number[]> = new Map();

  const postTitles = [
    'Обзор новостей', 'Промо-кампания', 'Интервью с экспертом', 'За кулисами проекта',
    'Релиз продукта', 'Сторителлинг', 'Анонс мероприятия', 'Кейс клиента',
    'Советы от команды', 'Тренды недели',
  ];
  const taskTitlePrefixes = [
    'Написать текст', 'Создать дизайн', 'Смонтировать видео', 'Сделать фото',
    'Подготовить карточки', 'Сверстать пост', 'Записать озвучку', 'Отрендерить анимацию',
  ];

  // 5. Генерация постов и задач
  for (const month of months) {
    const firstDay = startOfMonth(new Date(year, month - 1));
    const lastDay = endOfMonth(new Date(year, month - 1));
    const allDays = eachDayOfInterval({ start: firstDay, end: lastDay });

    const numDays = Math.floor(Math.random() * 6) + 20;
    const shuffled = allDays.sort(() => Math.random() - 0.5);
    const chosenDays = shuffled.slice(0, numDays);

    let postsCreated = 0;
    while (postsCreated < POSTS_PER_MONTH) {
      const day = chosenDays[postsCreated % chosenDays.length];
      const deadline = setMinutes(setHours(day, 8 + Math.floor(Math.random() * 10)), 0);
      const durationDays = Math.floor(Math.random() * 6) + 2;
      const startDate = subDays(deadline, durationDays);

      const title = postTitles[Math.floor(Math.random() * postTitles.length)];
      const description = 'Контент для публикации. Включает все необходимые материалы.';
      const responsibleUserId = users[Math.floor(Math.random() * users.length)].user_id;
      const flags = randomContentFlags();

      const post = await prisma.post.create({
        data: {
          post_title: title,
          post_description: description,
          post_status: 'В работе',
          post_date: startDate,
          post_deadline: deadline,
          responsible_person_id: responsibleUserId,
          ...flags,
          telegram_published: null,
          vkontakte_published: null,
          MAX_published: null,
          is_published: false,
          approved_by_id: null,
        },
      });
      allPosts.push(post);
      postTaskMap.set(post.post_id, []);

      // Тег к посту
      await prisma.postTag.create({
        data: {
          post_id: post.post_id,
          tag_id: tags[Math.floor(Math.random() * tags.length)].tag_id,
        },
      });

      // Задачи (1–3)
      const taskCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < taskCount; i++) {
        const taskAction = taskTitlePrefixes[Math.floor(Math.random() * taskTitlePrefixes.length)];
        const taskTitle = `${taskAction} для "${title}"`;
        const creatorId = users[Math.floor(Math.random() * 3)].user_id;
        const assigneeId = users[Math.floor(Math.random() * users.length)].user_id;

        const taskStart = subDays(deadline, Math.floor(Math.random() * 3) + 1);
        const taskEnd = new Date(deadline.getTime() - Math.random() * 3600000 * 24);
        const priority = Math.floor(Math.random() * 5) + 1;

        const taskDescription = `Задача: ${taskAction}.
Пост: "${title}"
Срок: ${format(taskEnd, 'dd.MM.yyyy')}.
Требуется выполнить в соответствии со стандартами компании.`;

        const task = await prisma.task.create({
          data: {
            title: taskTitle,
            description: taskDescription,
            created_by_id: creatorId,
            start_time: taskStart,
            end_time: taskEnd,
            task_status: 'В работе',
            priority: priority,
            completed_task: null,
          },
        });

        await prisma.taskAssignee.create({
          data: { task_id: task.task_id, user_id: assigneeId },
        });

        await prisma.taskTag.create({
          data: {
            task_id: task.task_id,
            tag_id: tags[Math.floor(Math.random() * tags.length)].tag_id,
          },
        });

        postTaskMap.get(post.post_id)!.push(task.task_id);
      }

      // Комментарии к посту
      if (Math.random() > 0.35) {
        const cCount = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < cCount; j++) {
          await prisma.comment.create({
            data: {
              post_id: post.post_id,
              created_by_id: users[Math.floor(Math.random() * users.length)].user_id,
              text: `Правка №${j + 1}. Необходимо доработать визуал.`,
              task_type_id: Math.floor(Math.random() * 7) + 1,
              status: COMMENT_STATUSES[Math.floor(Math.random() * COMMENT_STATUSES.length)],
              created_at: subDays(post.post_deadline, Math.floor(Math.random() * 3) + 1),
            },
          });
        }
      }

      postsCreated++;
    }
  }

  console.log(`Создано постов: ${allPosts.length}`);

  // 6. ~25% опубликованных
  const totalPosts = allPosts.length;
  const publishedCount = Math.floor(totalPosts * 0.25);
  const publishedSet = new Set<number>();
  while (publishedSet.size < publishedCount) {
    publishedSet.add(Math.floor(Math.random() * totalPosts));
  }

  // 7. Функция заполнения результатов контента
  const fillContentResults = (post: any, full: boolean) => {
    const update: any = {};
    if (full) {
      update.post_done_link_mini_video_smm = post.post_needs_mini_video_smm ? 'https://cdn.example.com/mini_video_smm.mp4' : null;
      update.post_done_link_video = post.post_needs_video ? 'https://cdn.example.com/video.mp4' : null;
      update.post_done_link_cover_photo = post.post_needs_cover_photo ? 'https://cdn.example.com/cover.jpg' : null;
      update.post_done_link_photo_cards = post.post_needs_photo_cards ? 'https://cdn.example.com/cards.zip' : null;
      update.post_done_link_photogallery = post.post_needs_photogallery ? 'https://cdn.example.com/gallery.zip' : null;
      update.post_done_link_mini_gallery = post.post_needs_mini_gallery ? 'https://cdn.example.com/mini_gallery.zip' : null;
      update.post_done_link_text = post.post_needs_text ? 'Текст поста готов. Основной посыл: ...' : null;
    } else {
      update.post_done_link_mini_video_smm = post.post_needs_mini_video_smm && Math.random() > 0.5 ? 'https://cdn.example.com/mini_video_smm.mp4' : null;
      update.post_done_link_video = post.post_needs_video && Math.random() > 0.5 ? 'https://cdn.example.com/video.mp4' : null;
      update.post_done_link_cover_photo = post.post_needs_cover_photo && Math.random() > 0.5 ? 'https://cdn.example.com/cover.jpg' : null;
      update.post_done_link_photo_cards = post.post_needs_photo_cards && Math.random() > 0.5 ? 'https://cdn.example.com/cards.zip' : null;
      update.post_done_link_photogallery = post.post_needs_photogallery && Math.random() > 0.5 ? 'https://cdn.example.com/gallery.zip' : null;
      update.post_done_link_mini_gallery = post.post_needs_mini_gallery && Math.random() > 0.5 ? 'https://cdn.example.com/mini_gallery.zip' : null;
      update.post_done_link_text = post.post_needs_text && Math.random() > 0.5 ? 'Часть текста готова...' : null;
    }
    return update;
  };

  // 8. Обновление статусов постов и задач
  for (let idx = 0; idx < totalPosts; idx++) {
    const post = allPosts[idx];
    const isPublished = publishedSet.has(idx);

    const updateData: any = {};
    if (isPublished) {
      updateData.post_status = 'Завершен';
      updateData.is_published = true;
      updateData.telegram_published = Math.random() > 0.4 ? 'https://t.me/channel/123' : null;
      updateData.vkontakte_published = Math.random() > 0.4 ? 'https://vk.com/wall-123456_789' : null;
      updateData.MAX_published = Math.random() > 0.8 ? 'https://max.com/post/42' : null;
      if (!updateData.telegram_published && !updateData.vkontakte_published && !updateData.MAX_published) {
        updateData.telegram_published = 'https://t.me/channel/123';
      }
      updateData.approved_by_id = users[0].user_id;
      Object.assign(updateData, fillContentResults(post, true));
    } else {
      updateData.post_status = 'В работе';
      Object.assign(updateData, fillContentResults(post, false));
    }

    await prisma.post.update({
      where: { post_id: post.post_id },
      data: updateData,
    });

    const taskIds = postTaskMap.get(post.post_id) || [];

    // Обновление задач (без учёта файловых – они обработаются позже глобально)
    for (const taskId of taskIds) {
      const task = await prisma.task.findUnique({ where: { task_id: taskId } });
      if (!task) continue;

      const fileTask = isFileTask(task.title);

      if (isPublished) {
        if (!fileTask) {
          await prisma.task.update({
            where: { task_id: taskId },
            data: {
              task_status: 'Выполнена',
              completed_task: 'Задача полностью выполнена.',
            },
          });
        } else {
          // Для файловых задач в опубликованных постах – просто оставляем в работе (пока)
          await prisma.task.update({
            where: { task_id: taskId },
            data: {
              task_status: 'В работе',
              completed_task: null,
            },
          });
        }
      } else {
        if (!fileTask) {
          const complete = Math.random() < 0.7;
          if (complete) {
            await prisma.task.update({
              where: { task_id: taskId },
              data: {
                task_status: 'Выполнена',
                completed_task: 'Задача выполнена в срок.',
              },
            });
          } else {
            const statuses = ['В работе', 'Ожидает', 'На проверке'];
            await prisma.task.update({
              where: { task_id: taskId },
              data: { task_status: statuses[Math.floor(Math.random() * statuses.length)] },
            });
          }
        } else {
          const statuses = ['В работе', 'Ожидает'];
          await prisma.task.update({
            where: { task_id: taskId },
            data: {
              task_status: statuses[Math.floor(Math.random() * statuses.length)],
              completed_task: null,
            },
          });
        }
      }
    }
  }

  // === ГАРАНТИРОВАННАЯ ЗАЧИСТКА ВСЕХ ФАЙЛОВЫХ ЗАДАЧ ===
  console.log('🔧 Финальная проверка: сброс статуса для всех файловых задач...');
  const allTasks = await prisma.task.findMany();
  let fixedCount = 0;
  for (const task of allTasks) {
    if (isFileTask(task.title) && task.task_status === 'Выполнена') {
      await prisma.task.update({
        where: { task_id: task.task_id },
        data: {
          task_status: 'В работе',
          completed_task: null,
        },
      });
      fixedCount++;
    }
  }
  if (fixedCount > 0) {
    console.log(`⚠️ Исправлено ${fixedCount} файловых задач, которые ошибочно были выполнены.`);
  } else {
    console.log('✅ Все файловые задачи корректны (не выполнены).');
  }

  // 9. Итоговая статистика
  const finalPostCount = await prisma.post.count();
  const finalTaskCount = await prisma.task.count();
  const completedPosts = await prisma.post.count({ where: { post_status: 'Завершен' } });
  const completedTasks = await prisma.task.count({ where: { task_status: 'Выполнена' } });

  console.log(`✅ СИД ЗАВЕРШЁН`);
  console.log(`Постов: ${finalPostCount} (опубликовано: ${completedPosts})`);
  console.log(`Задач: ${finalTaskCount} (выполнено: ${completedTasks})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });