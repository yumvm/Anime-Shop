import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts, setCategoryFilter, setBrandFilter, setPriceFilter, setSearchFilter } from '../features/products/productsSlice';
import { selectUser } from '../store/authSlice';
import ProductCard from '../components/ProductCard';
import Filters from '../components/Filters';
import styles from '../styles/Catalog.module.css';

function Catalog() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const products = useSelector(state => state.products.filteredItems); // Используем отфильтрованные товары
  const status = useSelector(state => state.products.status);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchProducts());
    }
  }, [dispatch, status]);

  // Применяем фильтры из URL при загрузке компонента
  useEffect(() => {
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    if (category) {
      dispatch(setCategoryFilter(category));
    }
    if (brand) {
      dispatch(setBrandFilter(brand));
    }
    if (search) {
      dispatch(setSearchFilter(search));
    }
    if (minPrice || maxPrice) {
      dispatch(setPriceFilter({
        min: minPrice ? parseInt(minPrice) : undefined,
        max: maxPrice ? parseInt(maxPrice) : undefined
      }));
    }
  }, [dispatch, searchParams]);

  if (status === 'loading') {
    return <div>Загрузка товаров...</div>;
  }

  return (
    <section className={styles.catalog}>
      <h2>Каталог товаров</h2>
      <Filters />
      <div className={styles.productsGrid}>
        {products.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {products.length === 0 && <p>Товары не найдены по заданным фильтрам</p>}
    </section>
  );
}

export default Catalog;
