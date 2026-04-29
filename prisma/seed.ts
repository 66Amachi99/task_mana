import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { 
  addDays, subDays, startOfDay, setHours, setMinutes, 
  eachDayOfInterval, format, startOfYear 
} from 'date-fns';

const COLORS = [
  '#F7ADC440',
  '#48C88460',
  '#AB48BF60',
  '#FE4D3D40',
  '#44962740',
  '#41A5F340'
];

async function main() {
  console.log('🚀 Запуск ГИГА-СИДА (сотни записей)...');

  // 1. Очистка
  try {
    await prisma.comment.deleteMany();
    await prisma.postTag.deleteMany();
    await prisma.taskTag.deleteMany();
    await prisma.taskAssignee.deleteMany();
    await prisma.post.deleteMany();
    await prisma.task.deleteMany();
    await prisma.tag.deleteMany();
  } catch (e) {
    console.log('⚠️ Таблицы чисты или еще не созданы.');
  }

  // 2. Пользователи (по ролям из схемы)
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
    users.push(await prisma.user.upsert({
      where: { user_login: u.user_login },
      update: u,
      create: { ...u, user_password: '123' }
    }));
  }

  // 3. Теги (с вашей палитрой)
  const tagNames = ['Новости', 'Промо', 'Срочно', 'SMM', 'Кейс', 'Важное'];
  const tags = [];
  for (let i = 0; i < tagNames.length; i++) {
    tags.push(await prisma.tag.create({
      data: { name: tagNames[i], color: COLORS[i % COLORS.length] }
    }));
  }

  // 4. Генерация по дням
  const now = new Date();
  const startDate = startOfYear(now); // С 1 января
  const endDate = addDays(now, 30);   // До +30 дней вперед
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const postTitles = ['Дайджест', 'Обзор', 'Интервью', 'Пост', 'Релиз', 'Сторителл', 'Анонс', 'Кейс'];
  const taskTitles = ['Монтаж', 'Текст', 'Обложка', 'Съемка', 'Дизайн', 'Карточки', 'Верстка'];

  console.log(`--- Обработка ${days.length} дней... ---`);

  for (const day of days) {
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    const postsInDay = isWeekend ? 1 : 2; // В среднем 2 поста в будни

    for (let i = 0; i < postsInDay; i++) {
      const isPast = day < now;
      const status = isPast ? (Math.random() > 0.15 ? 'Завершен' : 'В работе') : 'В работе';

      const post = await prisma.post.create({
        data: {
          post_title: `${postTitles[Math.floor(Math.random() * postTitles.length)]} ${format(day, 'dd MMM')}`,
          post_description: 'Генерация со всеми типами контента для статистики.',
          post_status: status,
          post_deadline: setHours(day, 12 + i),
          responsible_person_id: users[Math.floor(Math.random() * users.length)].user_id,
          
          // ЗАПОЛНЕНИЕ ВСЕХ ТИПОВ КОНТЕНТА
          post_needs_mini_video_smm: Math.random() > 0.6,
          post_needs_video: Math.random() > 0.8,
          post_needs_cover_photo: true,
          post_needs_photo_cards: Math.random() > 0.5,
          post_needs_photogallery: Math.random() > 0.7,
          post_needs_mini_gallery: Math.random() > 0.6,
          post_needs_text: true,

          // Публикация для графиков "Охват площадок"
          telegram_published: isPast && Math.random() > 0.4 ? 'https://t.me/test' : null,
          vkontakte_published: isPast && Math.random() > 0.5 ? 'https://vk.com/test' : null,
          MAX_published: isPast && Math.random() > 0.8 ? 'https://max.com/test' : null,
          
          tags: {
            create: [{ tag_id: tags[Math.floor(Math.random() * tags.length)].tag_id }]
          }
        }
      });

      // Комментарии (правки) к постам
      if (Math.random() > 0.4) {
        const cCount = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < cCount; j++) {
          await prisma.comment.create({
            data: {
              post_id: post.post_id,
              created_by_id: users[Math.floor(Math.random() * users.length)].user_id,
              text: `Правка по визуалу #${j + 1}. Нужно поправить цвета.`,
              task_type_id: Math.floor(Math.random() * 7) + 1, // Привязка к типу контента (1-7)
              status: Math.random() > 0.6 ? 'completed' : 'new',
              created_at: subDays(post.post_deadline, 1)
            }
          });
        }
      }

      // Задачи (Task), привязанные к посту
      const taskCount = Math.floor(Math.random() * 3) + 1;
      for (let k = 0; k < taskCount; k++) {
        await prisma.task.create({
          data: {
            title: `${taskTitles[Math.floor(Math.random() * taskTitles.length)]} для ${post.post_title}`,
            created_by_id: users[0].user_id,
            start_time: subDays(post.post_deadline, 2),
            end_time: post.post_deadline,
            task_status: status === 'Завершен' ? 'Выполнена' : 'В работе',
            assignees: {
              create: [{ user_id: users[Math.floor(Math.random() * users.length)].user_id }]
            }
          }
        });
      }
    }
  }

  console.log(`✅ УСПЕХ: База наполнена!`);
  console.log(`Создано постов: ~${days.length * 2}`);
  console.log(`Создано комментариев (правок): ~${days.length * 3}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });