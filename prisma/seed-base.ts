import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

const COLORS = [
  '#F7ADC440',
  '#48C88460',
  '#AB48BF60',
  '#FE4D3D40',
  '#44962740',
  '#41A5F340',
];

async function main() {
  console.log('Запуск базового seed для mega-seed...');

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

  console.log('Пользователи созданы/обновлены');

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

  console.log('Теги созданы/обновлены');
  console.log('Базовый seed завершён успешно');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Ошибка базового seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });