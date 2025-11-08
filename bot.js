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

// Команда /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = msg.from.first_name || 'Пользователь';

  console.log(`Обработка /start от ${userName} (${userId})`);

  try {
    if (await checkSubscription(userId)) {
      bot.sendMessage(chatId, `✅ Привет, ${userName}! Вы подписаны на канал! Добро пожаловать!`);
    } else {
      const keyboard = {
        inline_keyboard: [
          [{ text: '📢 ПОДПИСАТЬСЯ НА КАНАЛ', url: 'https://t.me/uleymp' }],
          [{ text: '✅ Я ПОДПИСАЛСЯ', callback_data: 'check_sub' }]
        ]
      };
      
      bot.sendMessage(chatId, 
        `⚠️ Привет, ${userName}! Для использования бота необходимо подписаться на канал @uleymp\n\nПосле подписки нажмите кнопку ниже для проверки:`, 
        { reply_markup: keyboard }
      );
    }
  } catch (error) {
    console.log('Ошибка:', error);
    bot.sendMessage(chatId, '❌ Произошла ошибка, попробуйте позже');
  }
});

// Обработка кнопки
bot.on('callback_query', async (query) => {
  const userId = query.from.id;
  const userName = query.from.first_name || 'Пользователь';

  console.log(`Обработка кнопки от ${userName} (${userId})`);

  if (query.data === 'check_sub') {
    try {
      if (await checkSubscription(userId)) {
        bot.editMessageText(`✅ Отлично, ${userName}! Вы подписаны на канал! Теперь вам доступен функционал бота.`, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id
        });
      } else {
        bot.answerCallbackQuery(query.id, {
          text: `❌ ${userName}, вы еще не подписаны на канал! Подпишитесь и попробуйте снова.`,
          show_alert: true
        });
      }
    } catch (error) {
      console.log('Ошибка обработки кнопки:', error);
      bot.answerCallbackQuery(query.id, {
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
