import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOrdersByUser } from '../store/orderSlice';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Profile.module.css';
import { getUser } from '../utils/api.js';
import { selectUser, updateProfile } from '../store/authSlice';

function Profile() {
  const authUser = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const emptyOrders = useMemo(() => [], []);
  
  // Create a memoized selector to avoid recreating the selector function on each render
  const selectUserOrders = useCallback((state) => {
    console.log('Profile: Full orders state', state.orders);
    console.log('Profile: Auth user ID', authUser?.id);
    console.log('Profile: Checking if authUser exists', !!authUser);
    
    // Make sure the orders state exists before accessing it
    if (!state.orders) {
      console.warn('Profile: Orders state is undefined in Redux store');
      return emptyOrders;
    }
    
    const orders = state.orders?.[authUser?.id] || emptyOrders;
    console.log('Profile: Selector - заказы из состояния Redux для пользователя', authUser?.id, ':', orders);
    console.log('Profile: Length of orders', orders.length);
    return orders;
  }, [authUser?.id, emptyOrders]);
  
  const allOrders = useSelector(selectUserOrders);
  const [userData, setUserData] = useState({ lastName: '', firstName: '', phone: '', address: '' });
  const [orders, setOrders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token || !authUser) {
      // Если нет токена или пользователя, пользователь не авторизован
      console.log('Profile useEffect: Пользователь не авторизован или данные отсутствуют');
      return;
    }

    console.log('Profile useEffect: Загрузка данных профиля для пользователя', authUser);

    // Получаем информацию о пользователе с сервера
    const fetchUser = async () => {
      try {
        // Получаем актуальные данные пользователя с сервера
        try {
          console.log('Profile: Запрос данных пользователя с сервера для ID:', authUser.id);
          const userRes = await getUser(authUser.id);
          console.log('Profile: Ответ от сервера с данными пользователя', userRes);
          const freshUser = userRes.user;
          setUserData({
            lastName: freshUser.lastName || '',
            firstName: freshUser.firstName || '',
            phone: freshUser.phone || '',
            address: freshUser.address || ''
          });
          
          // Обновляем localStorage с актуальными данными
          localStorage.setItem('current_user', JSON.stringify(freshUser));
          console.log('Profile: Данные пользователя обновлены в состоянии и localStorage');
        } catch (userErr) {
          console.error('Ошибка загрузки данных пользователя:', userErr);
          // If authentication failed (token removed), we expect the token to be removed in api.js
          if (userErr.status === 401 || userErr.status === 403) {
            // Token should have been removed by api.js, component will re-render with proper auth state
            return;
          }
          // Если не удалось получить данные с сервера, используем данные из Redux
          setUserData({
            lastName: authUser.lastName || '',
            firstName: authUser.firstName || '',
            phone: authUser.phone || '',
            address: authUser.address || ''
          });
        }

        // Загружаем историю заказов с сервера
        console.log('Profile: Начинаем загрузку заказов для пользователя', authUser.id);
        setLoadingOrders(true);
        try {
          console.log('Profile: Вызов dispatch(fetchOrdersByUser) для пользователя', authUser.id);
          const result = await dispatch(fetchOrdersByUser(authUser.id));
          console.log('Profile: Результат загрузки заказов', result);
          // Check if the action was rejected due to authentication
          if (fetchOrdersByUser.rejected.match(result) && 
              (result.payload?.includes('Invalid or expired token') || 
               result.payload?.includes('Access token required') ||
               result.error?.message?.includes('Invalid or expired token'))) {
            // Token should have been removed by api.js, component will re-render with proper auth state
            return;
          }
        } catch (ordersErr) {
          console.error('Ошибка загрузки заказов:', ordersErr);
          // If authentication failed (token removed), reload the page to reset state
          if (ordersErr.status === 401 || ordersErr.status === 403) {
            // Token should have been removed by api.js, component will re-render with proper auth state
            return;
          }
          // В случае ошибки, используем пустой массив заказов
          setOrders([]);
        } finally {
          setLoadingOrders(false);
        }
      } catch (err) {
        console.error('Ошибка загрузки данных профиля:', err);
        // If authentication failed (token removed), reload the page to reset state
        if (err.status === 401 || err.status === 403) {
          // Token should have been removed by api.js, component will re-render with proper auth state
          return;
        }
        setError('Ошибка загрузки данных профиля');
        setLoadingOrders(false);
      }
    };

    fetchUser();
  }, [authUser, dispatch]);

  const handleChange = (e) => {
    setUserData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!authUser) return;
    setSaving(true);
    setError(null);

    const updatedUser = { id: authUser.id, ...userData };

    try {
      // Dispatch the updateProfile thunk
      const result = await dispatch(updateProfile(updatedUser));
      
      if (updateProfile.fulfilled.match(result)) {
        const serverUser = result.payload;
        
        // Update localStorage with server response
        localStorage.setItem('current_user', JSON.stringify(serverUser));
        
        setSaving(false);
        alert('Данные сохранены');
      } else {
        setSaving(false);
        setError(result.payload || 'Ошибка при сохранении на сервере');
        alert('Ошибка при сохранении на сервере');
      }
    } catch (err) {
      setSaving(false);
      setError('Ошибка при сохранении на сервере');
      alert('Ошибка при сохранении на сервере');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    // Перенаправляем на главную страницу
    window.location.href = '/';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      'pending': 'Ожидает обработки',
      'accepted': 'Принят продавцом',
      'processed': 'Обработан продавцом',
      'shipping': 'В доставке',
      'delivered': 'Заказ получен'
    };
    return statusLabels[status] || status;
  };

  const getPaymentMethodLabel = (method) => {
    const methodLabels = {
      'card': 'Банковская карта',
      'cash': 'Наличные при получении',
      'online': 'Онлайн оплата'
    };
    return methodLabels[method] || method;
  };

  if (!authUser) {
    return (
      <section className={styles.profile}>
        <h2>Личный кабинет</h2>
        <p>Пожалуйста, войдите в аккаунт, чтобы просматривать профиль.</p>
      </section>
    );
  }

  return (
    <section className={styles.profile}>
      <h2>Личный кабинет</h2>

      <div className={styles.card}>
        <div className={styles.left}>
          <label>Фамилия
            <input name="lastName" value={userData.lastName} onChange={handleChange} />
          </label>
          <label>Имя
            <input name="firstName" value={userData.firstName} onChange={handleChange} />
          </label>
          <label>Телефон
            <input name="phone" value={userData.phone} onChange={handleChange} />
          </label>
          <label>Адрес
            <input name="address" value={userData.address} onChange={handleChange} />
          </label>

          <div className={styles.buttons}>
            <button onClick={handleSave} disabled={saving}>
              {saving ? 'Сохраняем...' : '💾 Сохранить'}
            </button>
            <button onClick={handleLogout}>🚪 Выйти</button>
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>

        <div className={styles.right}>
          <p><strong>Email:</strong> {authUser.email}</p>
          <p><strong>Роль:</strong> {authUser.role}</p>
          <p><strong>Зарегистрирован:</strong> {new Date(authUser.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className={styles.orders}>
        <h3>🧾 История заказов</h3>
        {loadingOrders ? (
          <p>Загрузка...</p>
        ) : allOrders.length === 0 ? (
          <p>У вас пока нет заказов.</p>
        ) : (
          allOrders.map(order => (
            <div 
              key={order.id} 
              className={styles.orderCard}
              onClick={() => navigate(`/order/${order.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.orderHeader}>
                <p><strong>Заказ №:</strong> {order.id}</p>
                <p><strong>Дата:</strong> {new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <ul>
                {(order.items || []).map((item, i) => (
                  <li key={i}>{item.title || item.name} — {item.quantity || item.qty} шт. × {item.price} BYN</li>
                ))}
              </ul>
              <p><strong>Итого:</strong> {order.total} BYN</p>
              <p><strong>Способ оплаты:</strong> {getPaymentMethodLabel(order.paymentMethod)}</p>
              <p><strong>Статус заказа:</strong> <span className={styles.orderStatus} data-status={order.status}>{getStatusLabel(order.status)}</span></p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default Profile;
