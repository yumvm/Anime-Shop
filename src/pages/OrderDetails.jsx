import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/authSlice';
import styles from '../styles/OrderDetails.module.css';

function OrderDetails() {
  const { orderId } = useParams();
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  
  // Получаем все заказы пользователя
  const allOrders = useSelector(state => {
    const orders = state.orders?.[user?.id] || [];
    console.log('OrderDetails: Все заказы пользователя из Redux', user?.id, ':', orders);
    return orders;
  });
  
  // Находим конкретный заказ по ID
  const order = allOrders.find(order => order.id === orderId);
  console.log('OrderDetails: Найденный заказ по ID', orderId, ':', order);
  
  if (!user) {
    return (
      <section className={styles.orderDetails}>
        <h2>Детали заказа</h2>
        <p>Пожалуйста, войдите в аккаунт для просмотра заказа.</p>
      </section>
    );
  }
  
  if (!order) {
    return (
      <section className={styles.orderDetails}>
        <h2>Детали заказа</h2>
        <p>Заказ не найден или у вас нет доступа к этому заказу.</p>
        <button onClick={() => navigate('/profile')}>Вернуться к профилю</button>
      </section>
    );
  }

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

  return (
    <section className={styles.orderDetails}>
      <h2>Детали заказа №{order.id}</h2>
      
      <div className={styles.orderInfo}>
        <div className={styles.infoSection}>
          <h3>Информация о заказе</h3>
          <p><strong>Дата создания:</strong> {new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Статус:</strong> <span className={styles.status} data-status={order.status}>{getStatusLabel(order.status)}</span></p>
          <p><strong>Итоговая сумма:</strong> {order.total} BYN</p>
          <p><strong>Способ оплаты:</strong> {getPaymentMethodLabel(order.paymentMethod)}</p>
        </div>
        
        <div className={styles.customerSection}>
          <h3>Информация о покупателе</h3>
          <p><strong>Имя:</strong> {order.customerInfo?.firstName}</p>
          <p><strong>Фамилия:</strong> {order.customerInfo?.lastName}</p>
          <p><strong>Телефон:</strong> {order.customerInfo?.phone}</p>
          <p><strong>Email:</strong> {order.customerInfo?.email}</p>
          <p><strong>Адрес доставки:</strong> {order.customerInfo?.address}</p>
        </div>
      </div>
      
      <div className={styles.orderItems}>
        <h3>Товары в заказе</h3>
        <ul>
          {(order.items || []).map((item, index) => (
            <li key={index} className={styles.item}>
              <div className={styles.itemInfo}>
                <h4>{item.title || item.name}</h4>
                <p>Цена: {item.price} BYN</p>
                <p>Количество: {item.quantity || item.qty}</p>
                <p><strong>Итого: {(item.price * (item.quantity || item.qty)).toFixed(2)} BYN</strong></p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      <div className={styles.totalSection}>
        <h3>Итого</h3>
        <p><strong>Общая сумма:</strong> {order.total} BYN</p>
      </div>
      
      <button onClick={() => navigate('/profile')} className={styles.backButton}>
        Назад к профилю
      </button>
    </section>
  );
}

export default OrderDetails;