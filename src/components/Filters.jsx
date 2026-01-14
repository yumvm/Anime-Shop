import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  setCategoryFilter, 
  setBrandFilter, 
  setPriceFilter, 
  setSearchFilter, 
  resetFilters 
} from '../features/products/productsSlice';
import styles from '../styles/Filters.module.css';

function Filters() {
  const dispatch = useDispatch();
  const filters = useSelector(state => state.products.filters);
  const products = useSelector(state => state.products.items);
  
  // Получаем уникальные категории и бренды из товаров
  const categories = useMemo(() => [...new Set(products.map(p => p.category))], [products]);
  const brands = useMemo(() => [...new Set(products.map(p => p.brand))], [products]);
  
  // Стейты для локального управления формой
  const [tempMinPrice, setTempMinPrice] = useState(filters.minPrice);
  const [tempMaxPrice, setTempMaxPrice] = useState(filters.maxPrice);
  const [tempSearch, setTempSearch] = useState(filters.search);

  // Обработчики изменений
  const handleCategoryChange = (e) => {
    dispatch(setCategoryFilter(e.target.value));
  };

  const handleBrandChange = (e) => {
    dispatch(setBrandFilter(e.target.value));
  };

  const handlePriceChange = () => {
    dispatch(setPriceFilter({ min: tempMinPrice, max: tempMaxPrice }));
  };

  const handleSearchChange = () => {
    dispatch(setSearchFilter(tempSearch));
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
    setTempMinPrice(0);
    setTempMaxPrice(10000);
    setTempSearch('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchChange();
    }
  };

  return (
    <div className={styles.filters}>
      <h3>Фильтры</h3>
      
      {/* Поиск */}
      <div className={styles.filterGroup}>
        <label>Поиск:</label>
        <div className={styles.searchContainer}>
          <input
            type="text"
            value={tempSearch}
            onChange={(e) => setTempSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Поиск по названию, аниме или персонажу"
          />
          <button onClick={handleSearchChange}>Найти</button>
        </div>
      </div>
      
      {/* Категории */}
      <div className={styles.filterGroup}>
        <label>Категория:</label>
        <select value={filters.category} onChange={handleCategoryChange}>
          <option value="">Все категории</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {getCategoryName(category)}
            </option>
          ))}
        </select>
      </div>
      
      {/* Бренды */}
      <div className={styles.filterGroup}>
        <label>Бренд:</label>
        <select value={filters.brand} onChange={handleBrandChange}>
          <option value="">Все бренды</option>
          {brands.map(brand => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
      </div>
      
      {/* Цена */}
      <div className={styles.filterGroup}>
        <label>Цена:</label>
        <div className={styles.priceInputs}>
          <input
            type="number"
            value={tempMinPrice}
            onChange={(e) => setTempMinPrice(Number(e.target.value))}
            placeholder="Мин"
          />
          <span>-</span>
          <input
            type="number"
            value={tempMaxPrice}
            onChange={(e) => setTempMaxPrice(Number(e.target.value))}
            placeholder="Макс"
          />
          <button onClick={handlePriceChange}>Применить</button>
        </div>
      </div>
      
      {/* Кнопка сброса */}
      <div className={styles.filterGroup}>
        <button onClick={handleResetFilters} className={styles.resetButton}>
          Сбросить фильтры
        </button>
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

export default Filters;