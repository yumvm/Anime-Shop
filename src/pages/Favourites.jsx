import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromFavorite } from '../features/products/productsSlice';
import { addToCart } from '../features/cart/cartSlice';
import { selectUser } from '../store/authSlice';
import styles from '../styles/favourites.module.css';

function Favorites() {
  const favorites = useSelector(state => state.products.favorites);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  const handleRemove = (id) => {
    dispatch(removeFromFavorite(id));
  };

  const handleAddToCart = (item) => {
    dispatch(addToCart(item));
    dispatch(removeFromFavorite(item.id));  // Remove from favorites when adding to cart
  };

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

  return (
    <div className={styles.container}>
      <h2>Избранное</h2>
      {favorites.length === 0 ? (
        <p>У вас нет избранных товаров.</p>
      ) : (
        <div className={styles.favoritesGrid}>
          {favorites.map(item => (
            <div key={item.id} className={styles.favoriteItem}>
              <img src={item.image} alt={item.title} className={styles.image} />
              <div className={styles.info}>
                <h3 className={styles.title}>{item.title}</h3>
                <p className={styles.price}>{item.price} BYN</p>
                <p className={styles.category}>{getCategoryName(item.category)}</p>
                <p className={styles.animeSeries}>Аниме: {item.animeSeries}</p>
                <p className={styles.character}>Персонаж: {item.character}</p>
                
                <div className={styles.buttonGroup}>
                  <button 
                    onClick={() => handleAddToCart(item)} 
                    className={styles.addToCartBtn}
                  >
                    Добавить в корзину
                  </button>
                  <button 
                    onClick={() => handleRemove(item.id)} 
                    className={styles.removeBtn}
                  >
                    Удалить из избранного
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;
