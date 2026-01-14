import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3001;
const DATA_PATH = path.resolve(__dirname, 'data', 'users.json');

// JWT Secret - в продакшене должен быть в переменных окружения
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyfordevelopment';

app.use(cors());
app.use(express.json());

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

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

app.get('/', (req, res) => {
  res.send('Сервер работает');
});

// Регистрация нового пользователя
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Проверяем, существует ли пользователь с таким email
    const raw = fs.existsSync(DATA_PATH) ? fs.readFileSync(DATA_PATH, 'utf-8') : '[]';
    const users = JSON.parse(raw);

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем нового пользователя
    const newUser = {
      id: Date.now().toString(), // генерируем уникальный ID
      email,
      password: hashedPassword, // сохраняем хешированный пароль
      firstName: firstName || '',
      lastName: lastName || '',
      role: 'user',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Сохраняем в файл
    fs.writeFileSync(DATA_PATH, JSON.stringify(users, null, 2));

    // Создаем JWT токен
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' } // токен действителен 7 дней
    );

    // Возвращаем токен и данные пользователя (без пароля)
    res.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

// Вход пользователя
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Читаем пользователей из файла
    const raw = fs.existsSync(DATA_PATH) ? fs.readFileSync(DATA_PATH, 'utf-8') : '[]';
    const users = JSON.parse(raw);

    // Находим пользователя по email
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Создаем JWT токен
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Возвращаем токен и данные пользователя (без пароля)
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Ошибка входа:', err);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
});

// Получение профиля пользователя (защищенный маршрут)
app.get('/api/users/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.params.id;
    
    // Проверяем, что пользователь запрашивает свой профиль
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const raw = fs.existsSync(DATA_PATH) ? fs.readFileSync(DATA_PATH, 'utf-8') : '[]';
    const users = JSON.parse(raw);
    
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Возвращаем данные пользователя без пароля
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Ошибка получения профиля:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление профиля пользователя (защищенный маршрут)
app.put('/api/users/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.params.id;
    
    // Проверяем, что пользователь обновляет свой профиль
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const updateData = req.body;
    
    const raw = fs.existsSync(DATA_PATH) ? fs.readFileSync(DATA_PATH, 'utf-8') : '[]';
    const users = JSON.parse(raw);
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Обновляем только разрешенные поля
    users[userIndex] = {
      ...users[userIndex],
      firstName: updateData.firstName || users[userIndex].firstName,
      lastName: updateData.lastName || users[userIndex].lastName,
      phone: updateData.phone || users[userIndex].phone,
      address: updateData.address || users[userIndex].address
    };

    // Сохраняем в файл
    fs.writeFileSync(DATA_PATH, JSON.stringify(users, null, 2));

    // Возвращаем обновленные данные пользователя
    res.json({
      success: true,
      user: {
        id: users[userIndex].id,
        email: users[userIndex].email,
        firstName: users[userIndex].firstName,
        lastName: users[userIndex].lastName,
        phone: users[userIndex].phone,
        address: users[userIndex].address,
        role: users[userIndex].role,
        createdAt: users[userIndex].createdAt
      }
    });
  } catch (err) {
    console.error('Ошибка обновления профиля:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление профиля пользователя (защищенный маршрут)
app.post('/api/save-user', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id; // используем ID из токена
    const userData = req.body;

    const raw = fs.existsSync(DATA_PATH) ? fs.readFileSync(DATA_PATH, 'utf-8') : '[]';
    const users = JSON.parse(raw);

    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      // Обновляем только разрешенные поля
      users[idx] = {
        ...users[idx],
        firstName: userData.firstName || users[idx].firstName,
        lastName: userData.lastName || users[idx].lastName,
        phone: userData.phone || users[idx].phone,
        address: userData.address || users[idx].address
      };
    } else {
      // Если пользователя нет, добавляем его (в реальной ситуации такого быть не должно)
      users.push({
        id: userId,
        ...userData
      });
    }

    fs.writeFileSync(DATA_PATH, JSON.stringify(users, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка сервера:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Маршруты для заказов
const ORDERS_PATH = path.resolve(__dirname, 'data', 'orders.json');

// Создание заказа
app.post('/api/orders', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Создание заказа для пользователя:', userId);
    console.log('Тело запроса:', req.body);
    
    const orderData = { ...req.body, userId, id: Date.now().toString(), createdAt: new Date().toISOString(), status: 'pending' };
    console.log('Данные заказа:', orderData);

    const raw = fs.existsSync(ORDERS_PATH) ? fs.readFileSync(ORDERS_PATH, 'utf-8') : '[]';
    const orders = JSON.parse(raw);

    orders.push(orderData);

    fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2));
    console.log('Заказ успешно записан в файл');

    res.json({ success: true, order: orderData });
  } catch (err) {
    console.error('Ошибка создания заказа:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение заказов пользователя
app.get('/api/orders/:userId', authenticateToken, (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Проверяем, что пользователь запрашивает свои заказы
    if (req.user.id !== userId) {
      console.log('Попытка доступа к чужим заказам. Токен пользователя:', req.user.id, 'Запрашиваемый ID:', userId);
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    
    console.log('Получение заказов для пользователя:', userId);
    
    // Используем тот же путь, что и для записи заказов
    const raw = fs.existsSync(ORDERS_PATH) ? fs.readFileSync(ORDERS_PATH, 'utf-8') : '[]';
    const orders = JSON.parse(raw);
    
    // Фильтруем заказы по ID пользователя
    const userOrders = orders.filter(order => order.userId === userId);
    
    console.log('Найдено заказов для пользователя', userId, ':', userOrders.length);
    console.log('Заказы пользователя', userId, ':', userOrders);
    
    // Возвращаем заказы пользователя в формате { orders: [...] }, как ожидается в клиентском коде
    res.json({ orders: userOrders });
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении заказов' });
  }
});

// Маршруты для корзины
const CART_PATH = path.resolve(__dirname, 'data', 'cart.json');

app.get('/api/cart/:userId', authenticateToken, (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Проверяем, что пользователь запрашивает свою корзину
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const raw = fs.existsSync(CART_PATH) ? fs.readFileSync(CART_PATH, 'utf-8') : '{}';
    const cart = JSON.parse(raw);
    
    res.json({ items: cart[userId] || [] });
  } catch (err) {
    console.error('Ошибка получения корзины:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/cart/:userId', authenticateToken, (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Проверяем, что пользователь обновляет свою корзину
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const { items } = req.body;

    const raw = fs.existsSync(CART_PATH) ? fs.readFileSync(CART_PATH, 'utf-8') : '{}';
    const cart = JSON.parse(raw);

    cart[userId] = items || [];

    fs.writeFileSync(CART_PATH, JSON.stringify(cart, null, 2));

    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка обновления корзины:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Маршруты для избранного
const FAVS_PATH = path.resolve(__dirname, 'data', 'favs.json');

app.get('/api/favs/:userId', authenticateToken, (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Проверяем, что пользователь запрашивает свои избранные
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const raw = fs.existsSync(FAVS_PATH) ? fs.readFileSync(FAVS_PATH, 'utf-8') : '{}';
    const favs = JSON.parse(raw);
    
    res.json({ items: favs[userId] || [] });
  } catch (err) {
    console.error('Ошибка получения избранного:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/favs/:userId', authenticateToken, (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Проверяем, что пользователь обновляет свои избранные
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const { items } = req.body;

    const raw = fs.existsSync(FAVS_PATH) ? fs.readFileSync(FAVS_PATH, 'utf-8') : '{}';
    const favs = JSON.parse(raw);

    favs[userId] = items || [];

    fs.writeFileSync(FAVS_PATH, JSON.stringify(favs, null, 2));

    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка обновления избранного:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Маршруты для сравнения
const COMPARE_PATH = path.resolve(__dirname, 'data', 'compare.json');

app.get('/api/compare/:userId', authenticateToken, (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Проверяем, что пользователь запрашивает свои товары для сравнения
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const raw = fs.existsSync(COMPARE_PATH) ? fs.readFileSync(COMPARE_PATH, 'utf-8') : '{}';
    const compare = JSON.parse(raw);
    
    res.json({ items: compare[userId] || [] });
  } catch (err) {
    console.error('Ошибка получения сравнения:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/compare/:userId', authenticateToken, (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Проверяем, что пользователь обновляет свои товары для сравнения
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const { items } = req.body;

    const raw = fs.existsSync(COMPARE_PATH) ? fs.readFileSync(COMPARE_PATH, 'utf-8') : '{}';
    const compare = JSON.parse(raw);

    compare[userId] = items || [];

    fs.writeFileSync(COMPARE_PATH, JSON.stringify(compare, null, 2));

    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка обновления сравнения:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
