const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const BOT_TOKEN = '7411071202:AAFgoExnRZ1Dd6jt0-34Jzcn2ODDq2A8ah8';
const CHANNEL_CHAT_ID = '-1001513121427';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;

// Простая проверка подписки
async function checkSubscription(userId) {
  try {
    const member = await bot.getChatMember(CHANNEL_CHAT_ID, userId);
    return ['creator', 'administrator', 'member'].includes(member.status);
  } catch (error) {
    console.log('Ошибка проверки подписки:', error);
    return false;
  }
}

// Функция для отправки файла с Google Диска
async function sendResearchFile(chatId, userName) {
  try {
    console.log(`Пытаюсь отправить файл для ${userName} в чат ${chatId}`);
    
    // Сначала отправляем сообщение о загрузке
    const loadingMsg = await bot.sendMessage(chatId, 
      `📥 ${userName}, загружаю файл исследования...`
    );

    // ПРЯМАЯ ССЫЛКА ДЛЯ СКАЧИВАНИЯ С GOOGLE ДИСКА
    const fileUrl = 'https://drive.google.com/uc?export=download&id=1O9Y_DfAxFjsLL6WVqSSSUS3_9no-38Px';
    
    // Отправляем файл напрямую
    await bot.sendDocument(chatId, fileUrl, {
      caption: `📊 Исследование для ${userName}\n\n` +
               `Этот файл содержит актуальные данные и аналитику по вашему запросу.\n` +
               `Сохраните его для дальнейшего использования!`
    });

    // Удаляем сообщение о загрузке
    await bot.deleteMessage(chatId, loadingMsg.message_id);

    // Отправляем завершающее сообщение
    await bot.sendMessage(chatId,
      `✅ Файл успешно отправлен, ${userName}!\n\n` +
      `📖 *Что внутри исследования:*\n` +
      `• Актуальная аналитика рынка\n` +
      `• Рекомендации по оптимизации\n` +
      `• Примеры успешных кейсов\n` +
      `• Пошаговые инструкции\n\n` +
      `💡 *Совет:* Сохраните файл для дальнейшего использования!`,
      { parse_mode: 'Markdown' }
    );

    console.log('Файл успешно отправлен!');
    
  } catch (error) {
    console.log('ОШИБКА отправки файла:', error);
    
    // Если не получилось отправить файл, отправляем ссылку как запасной вариант
    await bot.sendMessage(chatId, 
      `❌ ${userName}, не удалось отправить файл напрямую.\n\n` +
      `📎 *Скачайте исследование по ссылке:*\n` +
      `https://drive.google.com/file/d/1O9Y_DfAxFjsLL6WVqSSSUS3_9no-38Px/view\n\n` +
      `💡 *Как скачать:*\n` +
      `1. Откройте ссылку выше\n` +
      `2. Нажмите "Скачать" (стрелка вниз)\n` +
      `3. Файл сохранится на ваше устройство`,
      { parse_mode: 'Markdown' }
    );
  }
}

// Команда /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = msg.from.first_name || 'Пользователь';

  console.log(`Обработка /start от ${userName} (${userId})`);

  try {
    if (await checkSubscription(userId)) {
      await bot.sendMessage(chatId, 
        `✅ Привет, ${userName}! Вы подписаны на канал! Добро пожаловать!\n\n` +
        `📚 *Теперь вам доступно исследование рынка*`
      );
      
      // Отправляем файл исследования
      await sendResearchFile(chatId, userName);
      
    } else {
      const keyboard = {
        inline_keyboard: [
          [{ text: '📢 ПОДПИСАТЬСЯ НА КАНАЛ', url: 'https://t.me/uleymp' }],
          [{ text: '✅ Я ПОДПИСАЛСЯ', callback_data: 'check_sub' }]
        ]
      };
      
      await bot.sendMessage(chatId, 
        `⚠️ Привет, ${userName}! Для получения доступа к исследованию необходимо подписаться на канал @uleymp\n\n` +
        `*После подписки вы получите:*\n` +
        `📊 Полное исследование рынка\n` +
        `📈 Аналитические данные\n` +
        `💡 Практические рекомендации`,
        { reply_markup: keyboard, parse_mode: 'Markdown' }
      );
    }
  } catch (error) {
    console.log('Ошибка:', error);
    await bot.sendMessage(chatId, '❌ Произошла ошибка, попробуйте позже');
  }
});

// Обработка кнопки
bot.on('callback_query', async (query) => {
  const userId = query.from.id;
  const userName = query.from.first_name || 'Пользователь';
  const chatId = query.message.chat.id;

  console.log(`Обработка кнопки от ${userName} (${userId})`);

  if (query.data === 'check_sub') {
    try {
      if (await checkSubscription(userId)) {
        await bot.editMessageText(
          `✅ Отлично, ${userName}! Вы подписаны на канал!\n\n` +
          `📥 *Загружаем файл исследования...*`,
          {
            chat_id: chatId,
            message_id: query.message.message_id,
            parse_mode: 'Markdown'
          }
        );

        // Отправляем файл исследования
        await sendResearchFile(chatId, userName);

      } else {
        await bot.answerCallbackQuery(query.id, {
          text: `❌ ${userName}, вы еще не подписаны на канал! Подпишитесь и попробуйте снова.`,
          show_alert: true
        });
      }
    } catch (error) {
      console.log('Ошибка обработки кнопки:', error);
      await bot.answerCallbackQuery(query.id, {
        text: '❌ Произошла ошибка, попробуйте позже',
        show_alert: true
      });
    }
  }
});

// Команда /research для повторной отправки файла
bot.onText(/\/research/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = msg.from.first_name || 'Пользователь';

  try {
    if (await checkSubscription(userId)) {
      await sendResearchFile(chatId, userName);
    } else {
      await bot.sendMessage(chatId,
        `❌ ${userName}, для доступа к исследованию необходимо подписаться на канал @uleymp\n\n` +
        `Используйте команду /start для проверки подписки.`
      );
    }
  } catch (error) {
    console.log('Ошибка команды /research:', error);
  }
});

// Для Render
app.get('/', (req, res) => {
  res.send('🤖 Telegram Bot is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Bot started on port ${PORT}`);
});

console.log('✅ Бот запущен и готов к работе!');
