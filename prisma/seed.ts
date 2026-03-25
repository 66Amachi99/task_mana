import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { format } from 'date-fns';

type SeedUser = {
  user_id: number;
  user_login: string;
};

type SeedTag = {
  tag_id: number;
  name: string;
  color: string;
};

const ACTIVE_STATUSES = ['new', 'completed'];

const COLORS = [
  '#F7ADC440',
  '#48C88460',
  '#AB48BF60',
  '#FE4D3D40',
  '#44962740',
  '#41A5F340',
];

async function ensureBaseUsersAndTags() {
  const users = [
    {
      user_login: 'admin',
      user_password: '123',
      admin_role: true,
      SMM_role: false,
      designer_role: false,
      coordinator_role: false,
      photographer_role: false,
    },
    {
      user_login: 'smm_user',
      user_password: '123',
      admin_role: false,
      SMM_role: true,
      designer_role: false,
      coordinator_role: false,
      photographer_role: false,
    },
    {
      user_login: 'designer_user',
      user_password: '123',
      admin_role: false,
      SMM_role: false,
      designer_role: true,
      coordinator_role: false,
      photographer_role: false,
    },
    {
      user_login: 'coordinator_user',
      user_password: '123',
      admin_role: false,
      SMM_role: false,
      designer_role: false,
      coordinator_role: true,
      photographer_role: false,
    },
    {
      user_login: 'photographer_user',
      user_password: '123',
      admin_role: false,
      SMM_role: false,
      designer_role: false,
      coordinator_role: false,
      photographer_role: true,
    },
    {
      user_login: 'multi_user',
      user_password: '123',
      admin_role: false,
      SMM_role: true,
      designer_role: true,
      coordinator_role: false,
      photographer_role: true,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { user_login: user.user_login },
      update: {
        user_password: user.user_password,
        admin_role: user.admin_role,
        SMM_role: user.SMM_role,
        designer_role: user.designer_role,
        coordinator_role: user.coordinator_role,
        photographer_role: user.photographer_role,
      },
      create: {
        user_login: user.user_login,
        user_password: user.user_password,
        admin_role: user.admin_role,
        SMM_role: user.SMM_role,
        designer_role: user.designer_role,
        coordinator_role: user.coordinator_role,
        photographer_role: user.photographer_role,
      },
    });
  }

  const tags = [
    { name: 'Новости', color: COLORS[0] },
    { name: 'Промо', color: COLORS[1] },
    { name: 'Дизайн', color: COLORS[2] },
    { name: 'Срочно', color: COLORS[3] },
    { name: 'Продакшн', color: COLORS[4] },
    { name: 'Контент', color: COLORS[5] },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {
        color: tag.color,
      },
      create: {
        name: tag.name,
        color: tag.color,
      },
    });
  }
}

async function updatePostFlags(postId: number) {
  const comments = await prisma.comment.findMany({
    where: { post_id: postId },
  });

  const hasActive = (taskTypeId: number) =>
    comments.some(
      (c) => c.task_type_id === taskTypeId && ACTIVE_STATUSES.includes(c.status)
    );

  await prisma.post.update({
    where: { post_id: postId },
    data: {
      has_active_comments_mini_video_smm: hasActive(1),
      has_active_comments_video: hasActive(2),
      has_active_comments_text: hasActive(3),
      has_active_comments_photogallery: hasActive(4),
      has_active_comments_cover_photo: hasActive(5),
      has_active_comments_photo_cards: hasActive(6),
      has_active_comments_mini_gallery: hasActive(7),
    },
  });
}

async function main() {
  await ensureBaseUsersAndTags();

  const admin = await prisma.user.findUnique({ where: { user_login: 'admin' } });
  const smm = await prisma.user.findUnique({ where: { user_login: 'smm_user' } });
  const designer = await prisma.user.findUnique({ where: { user_login: 'designer_user' } });
  const coordinator = await prisma.user.findUnique({ where: { user_login: 'coordinator_user' } });
  const photographer = await prisma.user.findUnique({ where: { user_login: 'photographer_user' } });
  const multiRole = await prisma.user.findUnique({ where: { user_login: 'multi_user' } });

  if (!admin || !smm || !designer || !coordinator || !photographer || !multiRole) {
    throw new Error('Не найдены базовые пользователи.');
  }

  const tagNews = await prisma.tag.findUnique({ where: { name: 'Новости' } });
  const tagPromo = await prisma.tag.findUnique({ where: { name: 'Промо' } });
  const tagDesign = await prisma.tag.findUnique({ where: { name: 'Дизайн' } });
  const tagUrgent = await prisma.tag.findUnique({ where: { name: 'Срочно' } });
  const tagProduction = await prisma.tag.findUnique({ where: { name: 'Продакшн' } });
  const tagContent = await prisma.tag.findUnique({ where: { name: 'Контент' } });

  if (!tagNews || !tagPromo || !tagDesign || !tagUrgent || !tagProduction || !tagContent) {
    throw new Error('Не найдены базовые теги.');
  }

  const users: SeedUser[] = [admin, smm, designer, coordinator, photographer, multiRole];
  const tags: SeedTag[] = [tagNews, tagPromo, tagDesign, tagUrgent, tagProduction, tagContent];

  const postTitleTemplates = [
    'Анонс весеннего обновления',
    'Подборка лучших решений',
    'Новый формат публикации',
    'История клиента',
    'Репортаж из офиса',
    'Запуск промо-кампании',
    'Большой релиз месяца',
    'Серия карточек с фактами',
    'Анонс события',
    'Дайджест недели',
    'Обновление визуального стиля',
    'Видео о процессе',
    'Подборка кейсов',
    'Материал о команде',
    'Продуктовая публикация',
    'Фотогалерея месяца',
    'Мини-галерея с бэкстейджем',
    'Контент про закулисье',
    'Анонс вебинара',
    'Результаты месяца',
  ];

  const postDescriptionTemplates = [
    'Публикация с описанием ключевых изменений и акцентом на визуальную подачу.',
    'Материал для вовлечения аудитории с понятной структурой и сильным заголовком.',
    'Контент, который нужен для поддержки общего календаря публикаций.',
    'Пост в рамках продвижения продуктового направления компании.',
    'История, которую важно показать через визуал и короткий текст.',
    'Контент для усиления присутствия в социальных сетях.',
    'Публикация в рамках сезонного продвижения и брендинговой кампании.',
    'Материал с упором на практическую ценность для аудитории.',
  ];

  const taskTitleTemplates = [
    'Подготовить обложку',
    'Сделать фотогалерею',
    'Смонтировать короткое видео',
    'Написать текст публикации',
    'Собрать карточки',
    'Подготовить stories',
    'Сделать тизер',
    'Согласовать тексты',
    'Снять дополнительные кадры',
    'Подготовить галерею для публикации',
    'Оформить визуалы',
    'Собрать контент-план',
    'Подготовить анонс',
    'Нарисовать шаблоны',
    'Сделать баннеры',
    'Подготовить фотоотчёт',
    'Подобрать референсы',
    'Финализировать материалы',
    'Сделать reels',
    'Подготовить релиз',
  ];

  const taskDescriptionTemplates = [
    'Задача на подготовку материалов по контент-плану.',
    'Нужно собрать и оформить материалы в согласованном стиле.',
    'Приоритетная задача на ближайшие дни.',
    'Подготовить всё к публикации без сдвига по срокам.',
    'Нужно сделать аккуратную и чистую подачу.',
    'Задача связана с апрельским/мартовским контентом.',
    'Требуется согласование и доработка по результатам проверки.',
    'Подготовить итоговый вариант для отдачи в работу.',
  ];

  const commentTemplates = [
    { text: 'Нужно чуть сократить вступление.', status: 'new', task_type_id: 1 },
    { text: 'Видео почти готово, жду подтверждения.', status: 'completed', task_type_id: 2 },
    { text: 'Текст подтверждён.', status: 'confirmed', task_type_id: 3 },
    { text: 'Галерея почти собрана.', status: 'completed', task_type_id: 4 },
    { text: 'Нужен ещё один вариант обложки.', status: 'new', task_type_id: 5 },
    { text: 'Карточки стоит сделать чуть чище.', status: 'new', task_type_id: 6 },
    { text: 'Мини-галерея уже подходит.', status: 'confirmed', task_type_id: 7 },
  ];

  const marchAprilDates: Date[] = [];
  const start = new Date('2026-03-01T12:00:00.000Z');
  const end = new Date('2026-04-30T12:00:00.000Z');

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    marchAprilDates.push(new Date(d));
  }

  let createdPostsCount = 0;
  let createdTasksCount = 0;

  for (let i = 0; i < marchAprilDates.length; i++) {
    const baseDate = marchAprilDates[i];

    const dayPostsCount = i % 3 === 0 ? 2 : 1;
    const dayTasksCount = i % 2 === 0 ? 2 : 3;

    for (let p = 0; p < dayPostsCount; p++) {
      const title = `${postTitleTemplates[(i + p) % postTitleTemplates.length]} ${format(baseDate, 'dd.MM')}`;
      const description = postDescriptionTemplates[(i + p) % postDescriptionTemplates.length];

      const responsible = users[(i + p) % users.length];

      const needsMiniVideo = (i + p) % 4 === 0;
      const needsVideo = (i + p) % 3 === 0;
      const needsCover = true;
      const needsCards = (i + p) % 2 === 0;
      const needsGallery = (i + p) % 5 === 0;
      const needsMiniGallery = (i + p) % 4 === 1;
      const needsText = true;

      const deadline = new Date(baseDate);
      deadline.setHours(10 + (p % 6), 0, 0, 0);

      const existingPost = await prisma.post.findFirst({
        where: {
          post_title: title,
          post_deadline: deadline,
        },
      });

      if (!existingPost) {
        const selectedTagIds = [
          tags[(i + p) % tags.length].tag_id,
          tags[(i + p + 2) % tags.length].tag_id,
        ];

        const post = await prisma.post.create({
          data: {
            post_title: title,
            post_description: description,
            post_status: (i + p) % 11 === 0 ? 'Завершен' : 'В работе',
            tz_link: `https://example.com/tz/post-${i + 1}-${p + 1}`,
            responsible_person_id: responsible.user_id,
            approved_by_id: null,
            post_needs_mini_video_smm: needsMiniVideo,
            post_needs_video: needsVideo,
            post_needs_cover_photo: needsCover,
            post_needs_photo_cards: needsCards,
            post_needs_photogallery: needsGallery,
            post_needs_mini_gallery: needsMiniGallery,
            post_needs_text: needsText,
            post_deadline: deadline,
            tags: {
              create: selectedTagIds.map((tagId) => ({ tag_id: tagId })),
            },
          },
        });

        createdPostsCount += 1;

        const commentsToCreate = [
          commentTemplates[(i + p) % commentTemplates.length],
          commentTemplates[(i + p + 2) % commentTemplates.length],
        ];

        for (let c = 0; c < commentsToCreate.length; c++) {
          const commentTemplate = commentsToCreate[c];
          const author = users[(i + p + c) % users.length];

          await prisma.comment.create({
            data: {
              post_id: post.post_id,
              created_by_id: author.user_id,
              task_type_id: commentTemplate.task_type_id,
              text: `${commentTemplate.text} (${format(baseDate, 'dd.MM')})`,
              status: commentTemplate.status,
            },
          });
        }

        await updatePostFlags(post.post_id);
      }
    }

    for (let t = 0; t < dayTasksCount; t++) {
      const title = `${taskTitleTemplates[(i + t) % taskTitleTemplates.length]} ${format(baseDate, 'dd.MM')}`;
      const description = taskDescriptionTemplates[(i + t) % taskDescriptionTemplates.length];

      const creator = users[(i + t) % users.length];
      const startTime = new Date(baseDate);
      startTime.setHours(9 + (t % 5), 0, 0, 0);

      const endTime = new Date(baseDate);
      endTime.setHours(14 + (t % 6), 30, 0, 0);

      const existingTask = await prisma.task.findFirst({
        where: {
          title,
          start_time: startTime,
          end_time: endTime,
        },
      });

      if (!existingTask) {
        const task = await prisma.task.create({
          data: {
            title,
            description,
            created_by_id: creator.user_id,
            start_time: startTime,
            end_time: endTime,
            all_day: false,
            priority: ((i + t) % 3) + 1,
            task_status:
              (i + t) % 9 === 0
                ? 'Выполнена'
                : (i + t) % 3 === 0
                  ? 'В работе'
                  : 'Поставлена',
            completed_task:
              (i + t) % 9 === 0 ? 'Задача завершена и результаты переданы.' : null,
          },
        });

        createdTasksCount += 1;

        const assigneeIds = [
          users[(i + t + 1) % users.length].user_id,
          users[(i + t + 2) % users.length].user_id,
        ];

        for (const userId of assigneeIds) {
          const exists = await prisma.taskAssignee.findFirst({
            where: {
              task_id: task.task_id,
              user_id: userId,
            },
          });

          if (!exists) {
            await prisma.taskAssignee.create({
              data: {
                task_id: task.task_id,
                user_id: userId,
              },
            });
          }
        }

        const selectedTagIds = [
          tags[(i + t) % tags.length].tag_id,
          tags[(i + t + 3) % tags.length].tag_id,
        ];

        for (const tagId of selectedTagIds) {
          const exists = await prisma.taskTag.findFirst({
            where: {
              task_id: task.task_id,
              tag_id: tagId,
            },
          });

          if (!exists) {
            await prisma.taskTag.create({
              data: {
                task_id: task.task_id,
                tag_id: tagId,
              },
            });
          }
        }
      }
    }
  }

  console.log('Mega seed completed successfully');
  console.log(`Created posts: ${createdPostsCount}`);
  console.log(`Created tasks: ${createdTasksCount}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Mega seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });