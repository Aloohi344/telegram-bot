const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const BOT_TOKEN = '7411071202:AAFgoExnRZ1Dd6jt0-34Jzcn2ODDq2A8ah8';
const CHANNEL_CHAT_ID = '-1001513121427';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;

// Проверка подписки на канал
async function checkSubscription(userId) {
  try {
    const member = await bot.getChatMember(CHANNEL_CHAT_ID, userId);
    return ['creator', 'administrator', 'member'].includes(member.status);
  } catch (error) {
    return false;
  }
}

// Отправка файла исследования
async function sendResearchFile(chatId, userName) {
  try {
    // Сообщение о загрузке
    const loadingMsg = await bot.sendMessage(chatId, 
      `📥 ${userName}, загружаю файл исследования...`
    );

    // Ссылка на файл
    const fileUrl = 'https://raw.githubusercontent.com/Aloohi344/telegram-bot/main/analytics_11_categories.pdf';
    
    // Отправляем файл
    await bot.sendDocument(chatId, fileUrl, {
      caption: `📊 Исследование для ${userName}\n\n` +
               `*Аналитика 11 категорий на маркетплейсах*\n\n` +
               `✅ Файл успешно загружен!`,
      parse_mode: 'Markdown'
    });

    // Удаляем сообщение о загрузке
    await bot.deleteMessage(chatId, loadingMsg.message_id);

    // Финальное сообщение
    await bot.sendMessage(chatId,
      `🎉 *${userName}, исследование доставлено!*\n\n` +
      `📖 *Содержание:*\n` +
      `• Анализ 11 ключевых категорий\n` +
      `• Тенденции рынка маркетплейсов\n` +
      `• Рекомендации по выбору ниши\n` +
      `• Стратегии роста продаж\n\n` +
      `💡 Сохраните файл для изучения!`,
      { parse_mode: 'Markdown' }
    );

  } catch (error) {
    // Просто сообщаем об ошибке
    await bot.sendMessage(chatId,
      `❌ ${userName}, не удалось отправить файл.\n\n` +
      `Попробуйте позже или обратитесь в поддержку.`
    );
  }
}

// Команда /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = msg.from.first_name || 'Пользователь';

  try {
    if (await checkSubscription(userId)) {
      await sendResearchFile(chatId, userName);
    } else {
      const keyboard = {
        inline_keyboard: [
          [{ text: '📢 ПОДПИСАТЬСЯ НА КАНАЛ', url: 'https://t.me/uleymp' }],
          [{ text: '✅ Я ПОДПИСАЛСЯ', callback_data: 'check_sub' }]
        ]
      };
      
      await bot.sendMessage(chatId, 
        `⚠️ Привет, ${userName}!\n\n` +
        `Для доступа к исследованию подпишитесь на канал @uleymp\n\n` +
        `*После подписки получите:*\n` +
        `📊 Аналитику 11 категорий\n` +
        `📈 Данные по трендам рынка\n` +
        `💡 Рекомендации по выбору ниши`,
        { reply_markup: keyboard, parse_mode: 'Markdown' }
      );
    }
  } catch (error) {
    await bot.sendMessage(chatId, '❌ Ошибка, попробуйте позже');
  }
});

// Обработка кнопки проверки подписки
bot.on('callback_query', async (query) => {
  const userId = query.from.id;
  const userName = query.from.first_name || 'Пользователь';
  const chatId = query.message.chat.id;

  if (query.data === 'check_sub') {
    try {
      if (await checkSubscription(userId)) {
        await bot.editMessageText(
          `✅ Отлично, ${userName}! Вы подписаны!\n\n` +
          `📥 Загружаем файл исследования...`,
          { chat_id: chatId, message_id: query.message.message_id }
        );

        await sendResearchFile(chatId, userName);

      } else {
        await bot.answerCallbackQuery(query.id, {
          text: '❌ Вы еще не подписаны! Подпишитесь и нажмите снова.',
          show_alert: true
        });
      }
    } catch (error) {
      await bot.answerCallbackQuery(query.id, {
        text: '❌ Ошибка, попробуйте позже',
        show_alert: true
      });
    }
  }
});

// Команда /research для повторной отправки
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
        `Используйте /start для проверки подписки.`
      );
    }
  } catch (error) {
    console.log('Ошибка команды /research:', error);
  }
});

// Статус для Render
app.get('/', (req, res) => {
  res.send('🤖 Telegram Bot is running!');
});

app.listen(PORT, () => {
  console.log(`✅ Бот запущен на порту ${PORT}`);
});
