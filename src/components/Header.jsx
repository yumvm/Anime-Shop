import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { loadCartFromServer } from '../features/cart/cartSlice';
import { loadFavsFromServer, loadCompareFromServer } from '../features/products/productsSlice';
import { selectUser, fetchUserProfile } from '../store/authSlice';
import { fetchProducts } from '../features/products/productsSlice';
import styles from '../styles/Header.module.css';
import logo from '../assets/logo.png';
import cartIcon from '../assets/icons/cart.png';
import heartIcon from '../assets/icons/heart.png';
import compareIcon from '../assets/icons/compare.png';
import userIcon from '../assets/icons/user.png';
import Tooltip from './Tooltip';
import LoginRegisterModal from './LoginRegisterModal';
import { useNotification } from '../contexts/NotificationContext';

function Header() {
  const dispatch = useDispatch();
  const authUser = useSelector(selectUser);
  const allProducts = useSelector(state => state.products.items);
  const cartItems = useSelector(state => state.cart.items);
  const favoriteItems = useSelector(state => state.products.favorites);
  const compareItems = useSelector(state => state.products.compare);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  useEffect(() => {
    // Load user data from server if authenticated
    const token = localStorage.getItem('auth_token');
    if (authUser?.id && token) {
      // Load cart, favorites, and comparison from server
      dispatch(loadCartFromServer(authUser.id));
      dispatch(loadFavsFromServer(authUser.id));
      dispatch(loadCompareFromServer(authUser.id));
      dispatch(fetchUserProfile(authUser.id));
    }
  }, [authUser, dispatch]);

  useEffect(() => {
    // Load all products for search
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    // Filter products based on search query
    const filteredProducts = allProducts.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.animeSeries && item.animeSeries.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.character && item.character.toLowerCase().includes(searchQuery.toLowerCase()))
    ).slice(0, 5); // Limit to 5 results

    // Get unique categories
    const categoriesSet = new Set();
    allProducts.forEach(item => {
      if ((item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.animeSeries && item.animeSeries.toLowerCase().includes(searchQuery.toLowerCase()))) {
        const category = item.category || item.animeSeries;
        if (category) {
          categoriesSet.add(category);
        }
      }
    });
    const categories = Array.from(categoriesSet).slice(0, 3); // Limit to 3 categories

    // Combine products and categories in results
    const results = [
      ...filteredProducts.map(item => ({ type: 'product', ...item })),
      ...categories.map(category => ({ type: 'category', name: category }))
    ];

    setSearchResults(results);
  }, [searchQuery, allProducts]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSearchResults(true);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  const handleResultClick = (result) => {
    if (result.type === 'product') {
      // For now, just navigate to catalog with search term
      navigate(`/catalog?search=${encodeURIComponent(result.title)}`);
    } else if (result.type === 'category') {
      navigate(`/catalog?category=${encodeURIComponent(result.name)}`);
    }
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const isAuthenticated = Boolean(authUser?.id);

  const openOrNavigate = (path) => {
    const token = localStorage.getItem('auth_token');
    if (!isAuthenticated || !token) {
      setAuthModalOpen(true);
    } else {
      navigate(path);
    }
  };

  const handleCartClick = () => {
    const token = localStorage.getItem('auth_token');
    if (!isAuthenticated || !token) {
      setAuthModalOpen(true);
    } else {
      navigate('/cart');
      if (cartItems.length > 0) {
        addNotification(`Корзина: ${cartItems.length} ${cartItems.length === 1 ? 'товар' : cartItems.length < 5 ? 'товара' : 'товаров'}`, 'info', 2000);
      } else {
        addNotification('Корзина пуста', 'info', 2000);
      }
    }
  };

  const handleFavoritesClick = () => {
    const token = localStorage.getItem('auth_token');
    if (!isAuthenticated || !token) {
      setAuthModalOpen(true);
    } else {
      navigate('/favorites');
      if (favoriteItems.length > 0) {
        addNotification(`Избранное: ${favoriteItems.length} ${favoriteItems.length === 1 ? 'товар' : favoriteItems.length < 5 ? 'товара' : 'товаров'}`, 'info', 2000);
      } else {
        addNotification('Избранное пусто', 'info', 2000);
      }
    }
  };

  const handleCompareClick = () => {
    const token = localStorage.getItem('auth_token');
    if (!isAuthenticated || !token) {
      setAuthModalOpen(true);
    } else {
      navigate('/compare');
      if (compareItems.length > 0) {
        addNotification(`Сравнение: ${compareItems.length} ${compareItems.length === 1 ? 'товар' : compareItems.length < 5 ? 'товара' : 'товаров'}`, 'info', 2000);
      } else {
        addNotification('Нет товаров для сравнения', 'info', 2000);
      }
    }
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.logoBlock}>
          <Link to="/" className={styles.logoBlock}>
            <img src={logo} alt="Anime Shop Logo" className={styles.logo} />
          </Link>
        </div>

        <div className={styles.searchBlock}>
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <input 
              type="text" 
              placeholder="Поиск товаров..." 
              className={styles.searchInput}
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowSearchResults(true)}
            />
            <button type="submit" className={styles.searchButton}>🔍</button>
          </form>
          
          {showSearchResults && searchResults.length > 0 && (
            <div className={styles.searchResults}>
              {searchResults.map((result, index) => (
                <div 
                  key={index} 
                  className={styles.searchResultItem}
                  onClick={() => handleResultClick(result)}
                >
                  {result.type === 'product' ? (
                    <div className={styles.productResult}>
                      <img src={result.image} alt={result.title} className={styles.resultImage} />
                      <div className={styles.resultInfo}>
                        <div className={styles.resultTitle}>{result.title}</div>
                        <div className={styles.resultPrice}>{result.price} BYN</div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.categoryResult}>
                      📁 {result.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Tooltip text="Корзина">
            <button className={styles.iconButton} onClick={handleCartClick}>
              <img src={cartIcon} alt="Корзина" />
              {cartItems.length > 0 && (
                <span className={styles.badge}>{cartItems.reduce((total, item) => total + item.quantity, 0)}</span>
              )}
            </button>
          </Tooltip>

          <Tooltip text="Избранное">
            <button className={styles.iconButton} onClick={handleFavoritesClick}>
              <img 
                src={heartIcon} 
                alt="Избранное" 
                className={favoriteItems.length > 0 ? styles.heartFilled : ''}
              />
              {favoriteItems.length > 0 && (
                <span className={styles.badge}>{favoriteItems.length}</span>
              )}
            </button>
          </Tooltip>

          <Tooltip text="Сравнение">
            <button className={styles.iconButton} onClick={handleCompareClick}>
              <img src={compareIcon} alt="Сравнение" />
              {compareItems.length > 0 && (
                <span className={styles.badge}>{compareItems.length}</span>
              )}
            </button>
          </Tooltip>

          <Tooltip text={isAuthenticated ? "Вы вошли" : "Профиль"}>
            <button className={styles.iconButton} onClick={() => openOrNavigate('/profile')}>
              <img src={userIcon} alt="Профиль" />
              {isAuthenticated && <span className={styles.authMark}></span>}
            </button>
          </Tooltip>
        </div>
      </header>

      <LoginRegisterModal
        visible={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={(user) => {  
          // After login, the Redux state will be updated automatically
          setAuthModalOpen(false);
        }}
        />
    </>
  );
}

export default Header;
