import usersSeed from '../../data/users.json';

const LS_USERS = 'app_users';

function ensureInit() {
  if (!localStorage.getItem(LS_USERS)) {
    localStorage.setItem(LS_USERS, JSON.stringify(usersSeed || []));
  }
}

export function getAllUsers() {
  ensureInit();
  try {
    return JSON.parse(localStorage.getItem(LS_USERS) || '[]');
  } catch {
    return [];
  }
}

export function saveAllUsers(users) {
  localStorage.setItem(LS_USERS, JSON.stringify(users));
}

export function getUserByEmail(email) {
  const users = getAllUsers();
  return users.find(u => u.email === email) || null;
}

export function getUserById(id) {
  const users = getAllUsers();
  return users.find(u => u.id === id) || null;
}

export function addUser(user) {
  const users = getAllUsers();
  users.push(user);
  saveAllUsers(users);
}

export function updateUser(id, patch) {
  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...patch };
  saveAllUsers(users);
  return users[idx];
}