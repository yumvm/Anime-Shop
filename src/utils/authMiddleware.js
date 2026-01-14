import { logout } from '../store/authSlice';

// Middleware для проверки аутентификации
export const authMiddleware = (store) => (next) => (action) => {
  // Проверяем, является ли действие, связанным с аутентификацией
  if (action.type.includes('auth/')) {
    // Проверяем токен при определенных действиях
    if (action.type === 'auth/login/fulfilled' || action.type === 'auth/register/fulfilled') {
      // После успешного входа или регистрации сохраняем токен в localStorage
      if (action.payload && action.payload.token) {
        localStorage.setItem('auth_token', action.payload.token);
      }
    } else if (action.type === 'auth/logout') {
      // При выходе удаляем токен
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
    }
  }
  
  return next(action);
};

// Функция для проверки токена при загрузке приложения
export const checkAuthTokenOnLoad = () => {
  const token = localStorage.getItem('auth_token');
  // Если токен есть, но состояние Redux не отражает это, 
  // возможно, приложение было перезагружено и нужно обновить состояние
  if (token) {
    // Токен есть, но Redux может не знать о пользователе
    // В этом случае мы можем попытаться восстановить состояние пользователя
    const user = localStorage.getItem('current_user');
    if (user) {
      try {
        return JSON.parse(user);
      } catch (e) {
        console.warn('Ошибка при разборе данных пользователя из localStorage');
        localStorage.removeItem('current_user');
      }
    }
  }
  return null;
};