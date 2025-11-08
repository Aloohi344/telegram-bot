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

// Функция для отправки файла
async function sendResearchFile(chatId, userName) {
  try {
    console.log(`Пытаюсь отправить файл для ${userName} в чат ${chatId}`);
    
    // Сначала отправляем сообщение о загрузке
    const loadingMsg = await bot.sendMessage(chatId, 
      `📥 ${userName}, загружаю файл исследования...`
    );

    // ПРЯМАЯ ССЫЛКА НА ВАШ ФАЙЛ В GITHUB
    const fileUrl = 'https://raw.githubusercontent.com/Aloohi344/telegram-bot/main/%D0%90%D0%BD%D0%B0%D0%BB%D0%B8%D1%82%D0%B8%D0%BA%D0%B0_11_%D0%BA%D0%B0%D1%82%D0%B5%D0%B3%D0%BE%D1%80%D0%B8%D0%B9_%D0%BD%D0%B0_%D0%BC%D0%B0%D1%80%D0%BA%D0%B5%D1%82%D0%BF%D0%BB%D0%B5%D0%B9%D1%81%D0%B0%D1%85.pdf';
    
    // Отправляем файл напрямую в чат
    await bot.sendDocument(chatId, fileUrl, {
      caption: `📊 Исследование для ${userName}\n\n` +
               `*Аналитика 11 категорий на маркетплейсах*\n\n` +
               `✅ Файл успешно загружен и готов к использованию!`,
      parse_mode: 'Markdown'
    });

    // Удаляем сообщение о загрузке
    await bot.deleteMessage(chatId, loadingMsg.message_id);

    // Отправляем завершающее сообщение
    await bot.sendMessage(chatId,
      `🎉 *${userName}, исследование успешно доставлено!*\n\n` +
      `📖 *Что внутри исследования:*\n` +
      `• Аналитика 11 ключевых категорий\n` +
      `• Тенденции рынка маркетплейсов\n` +
      `• Рекомендации по выбору ниши\n` +
      `• Стратегии роста продаж\n\n` +
      `💡 *Рекомендация:* Изучите файл внимательно для принятия взвешенных решений!`,
      { parse_mode: 'Markdown' }
    );

    console.log('Файл успешно отправлен!');
    
  } catch (error) {
    console.log('ОШИБКА отправки файла:', error);
    
    // Запасной вариант
    await bot.sendMessage(chatId,
      `❌ ${userName}, не удалось отправить файл напрямую.\n\n` +
      `📎 *Скачайте исследование по ссылке:*\n` +
      `https://github.com/Aloohi344/telegram-bot/blob/main/%D0%90%D0%BD%D0%B0%D0%BB%D0%B8%D1%82%D0%B8%D0%BA%D0%B0_11_%D0%BA%D0%B0%D1%82%D0%B5%D0%B3%D0%BE%D1%80%D0%B8%D0%B9_%D0%BD%D0%B0_%D0%BC%D0%B0%D1%80%D0%BA%D0%B5%D1%82%D0%BF%D0%BB%D0%B5%D0%B9%D1%81%D0%B0%D1%85.pdf\n\n` +
      `💡 Нажмите "Download" для скачивания файла.`,
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
        `📊 Аналитику 11 категорий маркетплейсов\n` +
        `📈 Данные по трендам рынка\n` +
        `💡 Рекомендации по выбору ниши`,
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

// Для Render
app.get('/', (req, res) => {
  res.send('🤖 Telegram Bot is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Bot started on port ${PORT}`);
});

console.log('✅ Бот запущен и готов к работе!');
