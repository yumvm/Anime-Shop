// Исправленный обработчик получения заказов пользователя
// Этот код должен заменить проблемный участок в server.js строке 304

import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Функция для безопасного разбора JSON
function safeJsonParse(data, defaultValue = null) {
  if (!data || data.length === 0) {
    return defaultValue;
  }
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка парсинга JSON:', error);
    return defaultValue;
  }
}

// Маршрут для получения заказов пользователя
router.get('/orders/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Проверяем, что userId предоставлен
    if (!userId) {
      return res.status(400).json({ error: 'ID пользователя обязателен' });
    }

    // Путь к файлу с заказами
    const ordersFilePath = path.join(process.cwd(), 'data', 'orders.json');
    
    let orders = [];
    
    // Проверяем существование файла
    try {
      const data = await fs.readFile(ordersFilePath, 'utf8');
      orders = safeJsonParse(data, []) || [];
    } catch (readError) {
      if (readError.code === 'ENOENT') {
        // Файл не существует, возвращаем пустой массив
        orders = [];
      } else {
        throw readError;
      }
    }

    // Фильтруем заказы по ID пользователя
    const userOrders = orders.filter(order => order.userId === userId);
    
    // Возвращаем заказы пользователя
    res.json(userOrders);
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении заказов' });
  }
});

export default router;