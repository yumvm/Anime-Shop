const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');

// Helper: гарантируем наличие папки и файлов
function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const files = {
    users: 'users.json',
    orders: 'orders.json',
    cart: 'cart.json',
    favs: 'favs.json',
    compare: 'compare.json'
  };

  for (const k in files) {
    const p = path.join(DATA_DIR, files[k]);
    if (!fs.existsSync(p)) fs.writeFileSync(p, '[]', 'utf8');
  }
}
ensureData();

function readJSON(filename) {
  const p = path.join(DATA_DIR, filename);
  try {
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('readJSON error', filename, err);
    return [];
  }
}
function writeJSON(filename, data) {
  const p = path.join(DATA_DIR, filename);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

// Middleware
app.use(cors());
app.use(express.json());

// --- Health
app.get('/', (req, res) => res.send({ ok: true }));

// ----------------- Users / Auth -----------------

// Register
app.post('/api/register', (req, res) => {
  try {
    const { email, password, firstName = '', lastName = '' } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const users = readJSON('users.json');
    if (users.find(u => u.email === email)) return res.status(409).json({ error: 'User exists' });

    const newUser = {
      id: uuidv4(),
      email,
      password, // Для простоты: plain text. В реальном приложении — хэшировать.
      firstName,
      lastName,
      phone: '',
      address: '',
      role: 'Покупатель',
      createdAt: Date.now()
    };
    users.push(newUser);
    writeJSON('users.json', users);
    const safeUser = { ...newUser }; delete safeUser.password;
    res.json({ user: safeUser });
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const users = readJSON('users.json');
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const safeUser = { ...user }; delete safeUser.password;
    res.json({ user: safeUser });
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

// Get current user by id
app.get('/api/users/:id', (req, res) => {
  try {
    const users = readJSON('users.json');
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const safe = { ...user }; delete safe.password;
    res.json({ user: safe });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Update user
app.put('/api/users/:id', (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body;
    const users = readJSON('users.json');
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    // Обновляем поля (не меняем пароль, если явно не передан)
    users[idx] = { ...users[idx], ...payload, id };
    writeJSON('users.json', users);
    const safe = { ...users[idx] }; delete safe.password;
    res.json({ user: safe });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// List users (admin)
app.get('/api/users', (req, res) => {
  try {
    const users = readJSON('users.json').map(u => { const s = { ...u }; delete s.password; return s; });
    res.json({ users });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ----------------- Orders -----------------

// Create order
app.post('/api/orders', (req, res) => {
  try {
    const order = req.body; // ожидаем: { userId, items: [{name, price, qty}], total }
    if (!order || !order.userId) return res.status(400).json({ error: 'Invalid order' });
    const orders = readJSON('orders.json');
    const newOrder = { id: uuidv4(), ...order, createdAt: Date.now() };
    orders.push(newOrder);
    writeJSON('orders.json', orders);
    res.json({ order: newOrder });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Get orders by userId
app.get('/api/orders/:userId', (req, res) => {
  try {
    const all = readJSON('orders.json');
    const userOrders = all.filter(o => o.userId === req.params.userId);
    res.json({ orders: userOrders });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ----------------- Cart (server-side) -----------------

// Get cart for user
app.get('/api/cart/:userId', (req, res) => {
  try {
    const carts = readJSON('cart.json');
    const cart = carts.find(c => c.userId === req.params.userId) || { userId: req.params.userId, items: [] };
    res.json({ cart });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// Update cart (replace)
app.put('/api/cart/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const items = req.body.items || [];
    const carts = readJSON('cart.json');
    const idx = carts.findIndex(c => c.userId === userId);
    if (idx !== -1) {
      carts[idx].items = items;
    } else {
      carts.push({ userId, items });
    }
    writeJSON('cart.json', carts);
    res.json({ cart: carts.find(c => c.userId === userId) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ----------------- Favorites -----------------

app.get('/api/favs/:userId', (req, res) => {
  try {
    const all = readJSON('favs.json');
    const entry = all.find(e => e.userId === req.params.userId) || { userId: req.params.userId, items: [] };
    res.json({ favs: entry.items });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

app.put('/api/favs/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const items = req.body.items || [];
    const all = readJSON('favs.json');
    const idx = all.findIndex(e => e.userId === userId);
    if (idx !== -1) all[idx].items = items; else all.push({ userId, items });
    writeJSON('favs.json', all);
    res.json({ favs: items });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ----------------- Compare -----------------

app.get('/api/compare/:userId', (req, res) => {
  try {
    const all = readJSON('compare.json');
    const entry = all.find(e => e.userId === req.params.userId) || { userId: req.params.userId, items: [] };
    res.json({ compare: entry.items });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

app.put('/api/compare/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const items = req.body.items || [];
    const all = readJSON('compare.json');
    const idx = all.findIndex(e => e.userId === userId);
    if (idx !== -1) all[idx].items = items; else all.push({ userId, items });
    writeJSON('compare.json', all);
    res.json({ compare: items });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ----------------- Start
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
