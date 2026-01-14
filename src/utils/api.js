const API_ROOT = 'http://localhost:3001/api';

// Функция для добавления токена авторизации к запросу
function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function apiFetch(path, opts = {}) {
  const headers = opts.headers || getAuthHeaders();
  console.log('API: Выполняем запрос к', `${API_ROOT}${path}`, 'с опциями:', opts);
  const res = await fetch(`${API_ROOT}${path}`, {
    headers,
    ...opts
  });
  console.log('API: Получен ответ с статусом', res.status, 'и заголовками:', res.headers);
  const text = await res.text();
  console.log('API: Тело ответа как текст:', text);
  try {
    // Проверяем, что текст ответа существует и содержит валидный JSON
    const json = text && text.trim() ? JSON.parse(text) : {};
    console.log('API: Разобранный JSON ответа:', json);
    
    // If the response status is 401 or 403 (unauthorized/forbidden), 
    // it likely means the token is invalid or expired
    if (res.status === 401 || res.status === 403) {
      // Remove the invalid token from localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
      // Optionally, redirect user to login page or clear user data
      console.warn('API: Токен недействителен или истек, удаляем из localStorage');
    }
    
    if (!res.ok) throw { status: res.status, body: json };
    return json;
  } catch (err) {
    console.log('API: Ошибка парсинга ответа или статус не ok:', err);
    if (err && err.status) {
      // If the error is due to authentication, remove the token
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        console.warn('API: Токен недействителен или истек, удаляем из localStorage');
      }
      throw err;
    }
    // Если ошибка парсинга JSON, но статус успешный, возвращаем пустой объект
    if (res.ok) {
      console.warn(`Предупреждение: Невозможно распарсить JSON-ответ от ${path}, возвращаем пустой объект`);
      return {};
    }
    throw { status: res.status, message: 'Invalid JSON response' };
  }
}

export async function register(data) {
  return apiFetch('/register', { method: 'POST', body: JSON.stringify(data) });
}
export async function login(data) {
  return apiFetch('/login', { method: 'POST', body: JSON.stringify(data) });
}
export async function getUser(id) {
  return apiFetch(`/users/${id}`, { method: 'GET' });
}
export async function updateUser(id, data) {
  return apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

// Orders
export async function createOrder(order) {
  return apiFetch('/orders', { method: 'POST', body: JSON.stringify(order) });
}
export async function getOrdersByUser(userId) {
  console.log('API: Запрос заказов пользователя с ID:', userId);
  const response = await apiFetch(`/orders/${userId}`, { method: 'GET' });
  console.log('API: Ответ на запрос заказов пользователя', userId, ':', response);
  // Проверяем формат ответа и возвращаем объект с полем orders, как ожидается в orderSlice
  if (Array.isArray(response)) {
    // Если сервер вернул массив (старый формат), оборачиваем в объект
    console.log('API: Сервер вернул массив, оборачиваем в объект с полем orders');
    return { orders: response };
  } else if (response.orders) {
    // Если сервер вернул объект с полем orders (новый формат)
    console.log('API: Сервер вернул объект с полем orders');
    return response;
  } else {
    // В других случаях возвращаем как есть
    console.log('API: Неожиданный формат ответа от сервера, возвращаем как есть');
    return response;
  }
}

// Cart
export async function getCart(userId) {
  return apiFetch(`/cart/${userId}`, { method: 'GET' });
}
export async function updateCart(userId, items) {
  return apiFetch(`/cart/${userId}`, { method: 'PUT', body: JSON.stringify({ items }) });
}

// Favs
export async function getFavs(userId) {
  return apiFetch(`/favs/${userId}`, { method: 'GET' });
}
export async function updateFavs(userId, items) {
  return apiFetch(`/favs/${userId}`, { method: 'PUT', body: JSON.stringify({ items }) });
}

// Compare
export async function getCompare(userId) {
  return apiFetch(`/compare/${userId}`, { method: 'GET' });
}
export async function updateCompare(userId, items) {
  return apiFetch(`/compare/${userId}`, { method: 'PUT', body: JSON.stringify({ items }) });
}