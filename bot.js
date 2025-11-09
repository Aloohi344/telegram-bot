const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');

const BOT_TOKEN = '7411071202:AAFgoExnRZ1Dd6jt0-34Jzcn2ODDq2A8ah8';
const CHANNEL_CHAT_ID = '-1001513121427';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;

// Функция для самопининга (чтобы Render не засыпал)
function startPinging() {
  setInterval(async () => {
    try {
      const response = await axios.get(`https://uleymp-bot.onrender.com/`);
      console.log('✅ Пинг отправлен, сервис активен');
    } catch (error) {
      console.log('❌ Ошибка пинга:', error.message);
    }
  }, 10 * 60 * 1000); // Каждые 10 минут
}

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
    const loadingMsg = await bot.sendMessage(chatId, `📥 ${userName}, загружаю файл исследования...`);

    const fileUrl = 'https://raw.githubusercontent.com/Aloohi344/telegram-bot/main/analytics_11_categories.pdf';
    
    await bot.sendDocument(chatId, fileUrl, {
      caption: `📊 Исследование для ${userName}\n\n*Аналитика 11 категорий на маркетплейсах*\n\n✅ Файл успешно загружен!`,
      parse_mode: 'Markdown'
    });

    await bot.deleteMessage(chatId, loadingMsg.message_id);

    await bot.sendMessage(chatId,
      `🎉 *${userName}, исследование доставлено!*\n\n` +
      `📖 *Содержание:*\n• Анализ 11 ключевых категорий\n• Тенденции рынка маркетплейсов\n• Рекомендации по выбору ниши\n• Стратегии роста продаж\n\n💡 Сохраните файл для изучения!`,
      { parse_mode: 'Markdown' }
    );

  } catch (error) {
    await bot.sendMessage(chatId, `❌ ${userName}, не удалось отправить файл.\n\nПопробуйте позже.`);
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
        `⚠️ Привет, ${userName}!\n\nДля доступа к исследованию подпишитесь на канал @uleymp`,
        { reply_markup: keyboard }
      );
    }
  } catch (error) {
    await bot.sendMessage(chatId, '❌ Ошибка, попробуйте позже');
  }
});

// Обработка кнопки
bot.on('callback_query', async (query) => {
  const userId = query.from.id;
  const userName = query.from.first_name || 'Пользователь';
  const chatId = query.message.chat.id;

  if (query.data === 'check_sub') {
    try {
      if (await checkSubscription(userId)) {
        await bot.editMessageText(`✅ Отлично, ${userName}! Вы подписаны!\n\n📥 Загружаем файл...`, 
          { chat_id: chatId, message_id: query.message.message_id });
        await sendResearchFile(chatId, userName);
      } else {
        await bot.answerCallbackQuery(query.id, {
          text: '❌ Вы еще не подписаны! Подпишитесь и нажмите снова.', show_alert: true });
      }
    } catch (error) {
      await bot.answerCallbackQuery(query.id, { text: '❌ Ошибка, попробуйте позже', show_alert: true });
    }
  }
});

// Статус для Render
app.get('/', (req, res) => {
  res.send('🤖 Telegram Bot is running!');
});

// Запускаем пинги при старте
startPinging();

app.listen(PORT, () => {
  console.log(`✅ Бот запущен на порту ${PORT}`);
});
