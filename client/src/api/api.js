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
  const res = await fetch(`${API_ROOT}${path}`, {
    headers,
    ...opts
  });
  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw { status: res.status, body: json };
    return json;
  } catch (err) {
    if (err && err.status) throw err;
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
  return apiFetch(`/orders/${userId}`, { method: 'GET' });
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
