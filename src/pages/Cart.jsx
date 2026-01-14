import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, updateQuantity, clearCart } from '../features/cart/cartSlice';
import { createOrder, fetchOrdersByUser } from '../store/orderSlice';
import { useNavigate } from 'react-router-dom';
import { selectUser } from '../store/authSlice';
import styles from '../styles/Cart.module.css';

function Cart() {
  const cartItems = useSelector(state => state.cart.items);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [orderForm, setOrderForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    email: user?.email || '',
    paymentMethod: 'card' // Default payment method
  });
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const handleRemove = (id) => {
    console.log('User clicked: Remove from Cart', id);
    dispatch(removeFromCart(id));
  };

  const handleQuantityChange = (id, newQuantity) => {
    console.log('User changed quantity for item', id, 'to', newQuantity);
    if (newQuantity <= 0) {
      dispatch(removeFromCart(id));
    } else {
      dispatch(updateQuantity({ id, quantity: newQuantity }));
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleInputChange = (e) => {
    console.log('User changed input field', e.target.name, 'to', e.target.value);
    setOrderForm({
      ...orderForm,
      [e.target.name]: e.target.value
    });
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    console.log('User submitted order form', orderForm);
    
    if (!user) {
      alert('Для оформления заказа необходимо войти в аккаунт');
      return;
    }

    setIsOrdering(true);

    try {
      const orderData = {
        userId: user.id,
        items: cartItems.map(item => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          price: item.price
        })),
        total: getTotalPrice(),
        customerInfo: {
          firstName: orderForm.firstName,
          lastName: orderForm.lastName,
          phone: orderForm.phone,
          address: orderForm.address,
          email: orderForm.email
        },
        paymentMethod: orderForm.paymentMethod,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      console.log('Submitting order:', orderData);
      await dispatch(createOrder(orderData));
      // Обновляем список заказов пользователя
      if (user) {
        await dispatch(fetchOrdersByUser(user.id));
      }
      setOrderSuccess(true);
      
      // Clear cart after successful order
      dispatch(clearCart());
      
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (error) {
      console.error('Ошибка оформления заказа:', error);
      alert('Ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз.');
    } finally {
      setIsOrdering(false);
    }
  };

  if (orderSuccess) {
    return (
      <section className={styles.cart}>
        <h2>Заказ оформлен!</h2>
        <p>Ваш заказ успешно оформлен. Мы свяжемся с вами в ближайшее время.</p>
      </section>
    );
  }

  return (
    <section className={styles.cart}>
      <h2>Корзина</h2>
      {cartItems.length === 0 ? (
        <p>Ваша корзина пуста.</p>
      ) : (
        <>
          <ul className={styles.list}>
            {cartItems.map(item => (
              <li key={item.id} className={styles.item}>
                <img src={item.image} alt={item.title} className={styles.image} />
                <div className={styles.info}>
                  <h3>{item.title}</h3>
                  <p>{item.price} BYN</p>
                  <div className={styles.quantityControl}>
                    <button 
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className={styles.quantityBtn}
                    >
                      -
                    </button>
                    <span className={styles.quantity}>{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className={styles.quantityBtn}
                    >
                      +
                    </button>
                  </div>
                  <p className={styles.total}>Итого: {item.price * item.quantity} BYN</p>
                </div>
                <button onClick={() => handleRemove(item.id)} className={styles.remove}>
                  Удалить
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.totalSection}>
            <h3>Общая стоимость: {getTotalPrice()} BYN</h3>
            
            {/* Order Form */}
            <div className={styles.orderForm}>
              <h3>Оформить заказ</h3>
              <form onSubmit={handleOrderSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName">Имя:</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={orderForm.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="lastName">Фамилия:</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={orderForm.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="phone">Телефон:</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={orderForm.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="address">Адрес:</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={orderForm.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={orderForm.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="paymentMethod">Способ оплаты:</label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={orderForm.paymentMethod}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="card">Банковская карта</option>
                    <option value="cash">Наличные при получении</option>
                    <option value="online">Онлайн оплата</option>
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  className={styles.orderBtn}
                  disabled={isOrdering}
                >
                  {isOrdering ? 'Оформление...' : 'Оформить заказ'}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default Cart;
