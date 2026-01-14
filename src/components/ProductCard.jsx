import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from '../styles/ProductCard.module.css';
import { addToCart } from '../features/cart/cartSlice';
import { addToFavorite, removeFromFavorite, addToCompare, removeFromCompare } from '../features/products/productsSlice';
import { selectUser } from '../store/authSlice';
import { useNotification } from '../contexts/NotificationContext';

function ProductCard({ product }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [showDetails, setShowDetails] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addNotification } = useNotification();
  const favorites = useSelector(state => state.products.favorites);
  const compareItems = useSelector(state => state.products.compare);

  const isFavorite = favorites.some(item => item.id === product.id);
  const isInCompare = compareItems.some(item => item.id === product.id);

  const handleAddToCart = () => {
    console.log('User clicked: Add to Cart', product.title);
    dispatch(addToCart({ ...product, quantity }));
    
    // Show notification
    addNotification(`✓ Товар "${product.title}" добавлен в корзину!`, 'success', 3000);
    
    // The useSyncWithServer hook will handle saving to server automatically
  };

  const handleToggleFavorite = () => {
    console.log('User clicked: Toggle Favorite', product.title);
    if (isFavorite) {
      dispatch(removeFromFavorite(product.id));
      addNotification(`❤️ Товар "${product.title}" удален из избранного`, 'info', 2000);
    } else {
      dispatch(addToFavorite(product));
      addNotification(`❤️ Товар "${product.title}" добавлен в избранное!`, 'success', 2000);
    }
    
    // The useSyncWithServer hook will handle saving to server automatically
  };

  const handleToggleCompare = () => {
    console.log('User clicked: Toggle Compare', product.title);
    if (isInCompare) {
      dispatch(removeFromCompare(product.id));
      addNotification(`⚖️ Товар "${product.title}" удален из сравнения`, 'info', 2000);
    } else {
      if (compareItems.length >= 4) {
        addNotification('⚠️ Нельзя добавить более 4 товаров для сравнения', 'warning', 3000);
        return;
      }
      dispatch(addToCompare(product));
      addNotification(`⚖️ Товар "${product.title}" добавлен для сравнения!`, 'success', 2000);
    }
    
    // The useSyncWithServer hook will handle saving to server automatically
  };

  const toggleDetails = () => {
    console.log('User clicked: Toggle Details');
    setShowDetails(!showDetails);
  };

  return (
    <div className={styles.card}>
      <img src={product.image} alt={product.title} className={styles.image} />
      <div className={styles.info}>
        <h3 className={styles.title}>{product.title}</h3>
        <p className={styles.price}>{product.price} BYN</p>
        <p className={styles.category}>{getCategoryName(product.category)}</p>
        <p className={styles.animeSeries}>Аниме: {product.animeSeries}</p>
        
        {showDetails && (
          <div className={styles.details}>
            <p><strong>Персонаж:</strong> {product.character}</p>
            <p><strong>Бренд:</strong> {product.brand}</p>
            <p><strong>Материал:</strong> {product.material}</p>
            <p><strong>Размер:</strong> {product.size}</p>
            <p><strong>Возраст:</strong> {product.ageRestriction}</p>
            <p><strong>Рейтинг:</strong> {product.rating}</p>
            <p><strong>Описание:</strong> {product.description}</p>
          </div>
        )}
        
        <div className={styles.buttonContainer}>
          <div className={styles.quantityControl}>
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className={styles.quantityBtn}
            >
              -
            </button>
            <span className={styles.quantity}>{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className={styles.quantityBtn}
            >
              +
            </button>
          </div>
          <button onClick={handleAddToCart} className={styles.button}>
            Добавить в корзину
          </button>
          <div className={styles.actionButtons}>
            <button 
              onClick={handleToggleFavorite} 
              className={`${styles.actionButton} ${isFavorite ? styles.filled : ''}`}
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>
            <button 
              onClick={handleToggleCompare} 
              className={`${styles.actionButton} ${isInCompare ? styles.filled : ''}`}
            >
              {isInCompare ? '⚖️' : '⚖️'}
            </button>
          </div>
          <button onClick={toggleDetails} className={styles.detailsButton}>
            {showDetails ? 'Скрыть' : 'Подробнее'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Вспомогательная функция для получения понятного названия категории
const getCategoryName = (category) => {
  const categoryNames = {
    'figurines': 'Фигурки',
    'posters': 'Плакаты',
    'books': 'Книги',
    'jewelry': 'Украшения',
    'clothing': 'Одежда',
    'accessories': 'Аксессуары',
    'cosplay': 'Косплей'
  };
  
  return categoryNames[category] || category;
};

export default ProductCard;
