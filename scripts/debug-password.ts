import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function debugPassword() {
  try {
    // Сначала посмотрим всех пользователей в базе
    console.log('📋 Все пользователи в базе:');
    const users = await prisma.user.findMany();
    
    users.forEach(user => {
      console.log(`\n👤 Пользователь:`);
      console.log(`  ID: ${user.user_id}`);
      console.log(`  Логин: "${user.user_login}"`);
      console.log(`  Длина логина: ${user.user_login.length}`);
      console.log(`  Хеш пароля: ${user.user_password?.substring(0, 20)}...`);
      console.log(`  Длина хеша: ${user.user_password?.length}`);
    });

    // Проверим конкретного пользователя
    const testLogin = 'admin'; // измени на свой логин
    console.log(`\n🔍 Проверяем пользователя "${testLogin}":`);
    
    const user = await prisma.user.findFirst({
      where: { user_login: testLogin }
    });

    if (user) {
      console.log(`✅ Найден: ${user.user_login}`);
      console.log(`Хеш: ${user.user_password}`);
      
      // Проверяем пароль
      const testPassword = 'admin123'; // измени на свой пароль
      console.log(`\n🔐 Проверяем пароль "${testPassword}":`);
      
      const isMatch = await bcrypt.compare(testPassword, user.user_password || '');
      console.log(`Пароль совпадает: ${isMatch ? '✅ ДА' : '❌ НЕТ'}`);
      
      if (!isMatch) {
        console.log('\n💡 Попробуем другие варианты:');
        console.log(`1. Проверь пробелы: "${testPassword.trim()}"`);
        console.log(`2. Попробуй без trim: "${testPassword}"`);
        
        // Покажем хеш пароля для отладки
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log(`3. Новый хеш для "${testPassword}": ${newHash}`);
        console.log(`4. Старый хеш в базе: ${user.user_password}`);
      }
    } else {
      console.log(`❌ Пользователь "${testLogin}" не найден`);
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPassword();