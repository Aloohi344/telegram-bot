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
    console.log(`🔍 Проверяем подписку пользователя ${userId}`);
    const member = await bot.getChatMember(CHANNEL_CHAT_ID, userId);
    console.log(`📊 Статус пользователя: ${member.status}`);
    return ['creator', 'administrator', 'member'].includes(member.status);
  } catch (error) {
    console.log('❌ Ошибка проверки подписки:', error);
    return false;
  }
}

// Функция для отправки файла
async function sendResearchFile(chatId, userName) {
  try {
    console.log(`🚀 Начинаем отправку файла для ${userName} в чат ${chatId}`);
    
    // Сначала отправляем сообщение о загрузке
    console.log(`📨 Отправляем сообщение о загрузке...`);
    const loadingMsg = await bot.sendMessage(chatId, 
      `📥 ${userName}, загружаю файл исследования...`
    );

    // ПРЯМАЯ ССЫЛКА НА ВАШ ФАЙЛ В GITHUB
    const fileUrl = 'https://raw.githubusercontent.com/Aloohi344/telegram-bot/main/%D0%90%D0%BD%D0%B0%D0%BB%D0%B8%D1%82%D0%B8%D0%BA%D0%B0_11_%D0%BA%D0%B0%D1%82%D0%B5%D0%B3%D0%BE%D1%80%D0%B8%D0%B9_%D0%BD%D0%B0_%D0%BC%D0%B0%D1%80%D0%BA%D0%B5%D1%82%D0%BF%D0%BB%D0%B5%D0%B9%D1%81%D0%B0%D1%85.pdf';
    
    console.log(`📎 Пытаемся отправить файл по ссылке: ${fileUrl}`);
    
    // Отправляем файл напрямую в чат
    await bot.sendDocument(chatId, fileUrl, {
      caption: `📊 Исследование для ${userName}\n\n` +
               `*Аналитика 11 категорий на маркетплейсах*\n\n` +
               `✅ Файл успешно загружен и готов к использованию!`,
      parse_mode: 'Markdown'
    });

    console.log(`✅ Файл отправлен успешно!`);
    
    // Удаляем сообщение о загрузке
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    console.log(`🗑️ Сообщение о загрузке удалено`);

    // Отправляем завершающее сообщение
    await bot.sendMessage(chatId,
      `🎉 *${userName}, исследование успешно доставлено!*`,
      { parse_mode: 'Markdown' }
    );

    console.log(`🎯 Процесс отправки файла завершен!`);
    
  } catch (error) {
    console.log('❌ ОШИБКА отправки файла:', error.message);
    console.log('🔍 Детали ошибки:', error);
    
    // Запасной вариант
    await bot.sendMessage(chatId,
      `❌ ${userName}, не удалось отправить файл.\n\n` +
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

  console.log(`\n=== НОВЫЙ ЗАПРОС /start ===`);
  console.log(`👤 Пользователь: ${userName} (${userId})`);
  console.log(`💬 Чат: ${chatId}`);

  try {
    const isSubscribed = await checkSubscription(userId);
    console.log(`📊 Результат проверки подписки: ${isSubscribed}`);
    
    if (isSubscribed) {
      console.log(`✅ Пользователь подписан, отправляем файл...`);
      // Отправляем файл исследования
      await sendResearchFile(chatId, userName);
    } else {
      console.log(`❌ Пользователь НЕ подписан, показываем кнопки...`);
      const keyboard = {
        inline_keyboard: [
          [{ text: '📢 ПОДПИСАТЬСЯ НА КАНАЛ', url: 'https://t.me/uleymp' }],
          [{ text: '✅ Я ПОДПИСАЛСЯ', callback_data: 'check_sub' }]
        ]
      };
      
      await bot.sendMessage(chatId, 
        `⚠️ Для доступа подпишитесь на канал @uleymp`,
        { reply_markup: keyboard }
      );
    }
  } catch (error) {
    console.log('💥 ОШИБКА в /start:', error);
    await bot.sendMessage(chatId, '❌ Произошла ошибка, попробуйте позже');
  }
});

// Обработка кнопки
bot.on('callback_query', async (query) => {
  const userId = query.from.id;
  const userName = query.from.first_name || 'Пользователь';
  const chatId = query.message.chat.id;

  console.log(`\n=== ОБРАБОТКА КНОПКИ ===`);
  console.log(`👤 Пользователь: ${userName} (${userId})`);

  if (query.data === 'check_sub') {
    try {
      const isSubscribed = await checkSubscription(userId);
      console.log(`📊 Результат проверки по кнопке: ${isSubscribed}`);
      
      if (isSubscribed) {
        console.log(`✅ Подписка подтверждена, отправляем файл...`);
        await bot.editMessageText(
          `✅ Отлично! Отправляю файл...`,
          { chat_id: chatId, message_id: query.message.message_id }
        );

        await sendResearchFile(chatId, userName);

      } else {
        console.log(`❌ Пользователь все еще не подписан`);
        await bot.answerCallbackQuery(query.id, {
          text: `❌ Вы еще не подписаны!`,
          show_alert: true
        });
      }
    } catch (error) {
      console.log('💥 ОШИБКА обработки кнопки:', error);
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
