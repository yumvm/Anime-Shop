import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCompare, clearCompare } from '../features/products/productsSlice';
import { selectUser } from '../store/authSlice';
import styles from '../styles/Compare.module.css';

function Compare() {
  const compareItems = useSelector(state => state.products.compare);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  const handleRemove = (id) => {
    dispatch(removeFromCompare(id));
  };

  const clearAll = () => {
    dispatch(clearCompare());
  };

  // Group items by category
  const groupItemsByCategory = () => {
    const grouped = {};
    compareItems.forEach(item => {
      const category = item.category || 'Без категории';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    return grouped;
  };

  // Get common properties for items in the same category
  const getCommonProperties = (items) => {
    if (items.length === 0) return [];
    
    const allProps = new Set();
    items.forEach(item => {
      Object.keys(item).forEach(key => {
        if (typeof item[key] !== 'object' && key !== 'id' && key !== 'image' && key !== 'title') {
          allProps.add(key);
        }
      });
    });

    // Find properties that exist in all items
    const commonProps = [];
    for (const prop of allProps) {
      if (items.every(item => item.hasOwnProperty(prop))) {
        commonProps.push(prop);
      }
    };
    
    return commonProps;
  };

  const groupedItems = useMemo(() => {
    const grouped = {};
    compareItems.forEach(item => {
      const category = item.category || 'Без категории';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    return grouped;
  }, [compareItems]);

  const memoizedGetCommonProperties = useMemo(() => {
    return (items) => {
      if (items.length === 0) return [];
      
      const allProps = new Set();
      items.forEach(item => {
        Object.keys(item).forEach(key => {
          if (typeof item[key] !== 'object' && key !== 'id' && key !== 'image' && key !== 'title') {
            allProps.add(key);
          }
        });
      });

      // Find properties that exist in all items
      const commonProps = [];
      for (const prop of allProps) {
        if (items.every(item => item.hasOwnProperty(prop))) {
          commonProps.push(prop);
        }
      };
      
      return commonProps;
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Сравнение товаров</h2>
        {compareItems.length > 0 && (
          <button onClick={clearAll} className={styles.clearBtn}>
            Очистить все
          </button>
        )}
      </div>
      
      {compareItems.length === 0 ? (
        <p>Нет товаров для сравнения.</p>
      ) : (
        Object.entries(groupedItems).map(([category, items]) => {
          const properties = memoizedGetCommonProperties(items);
          
          // Determine the number of products to apply appropriate CSS class
          const getTableClass = (count) => {
            if (count <= 2) return `${styles.compareTable} ${styles['two-products']}`;
            if (count === 3) return `${styles.compareTable} ${styles['three-products']}`;
            return `${styles.compareTable} ${styles['four-or-more-products']}`;
          };

          return (
            <div key={category} className={styles.categoryGroup}>
              <h3 className={styles.categoryTitle}>{category}</h3>
              
              <div className={getTableClass(items.length)}>
                {/* Header row with product images and titles */}
                <div className={styles.headerRow}>
                  <div className={styles.propertyCell}>Свойство</div>
                  {items.map(item => (
                    <div key={item.id} className={styles.productCell}>
                      <img src={item.image} alt={item.title} className={styles.productImage} />
                      <h4>{item.title}</h4>
                      <button 
                        onClick={() => handleRemove(item.id)} 
                        className={styles.removeProductBtn}
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Property rows */}
                {properties.map(property => (
                  <div key={property} className={styles.dataRow}>
                    <div className={styles.propertyCell}>
                      <strong>{formatPropertyName(property)}</strong>
                    </div>
                    {items.map(item => (
                      <div key={`${item.id}-${property}`} className={styles.productCell}>
                        {item[property] || 'Не указано'}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// Helper function to format property names
const formatPropertyName = (prop) => {
  const nameMap = {
    'price': 'Цена',
    'category': 'Категория',
    'animeSeries': 'Аниме',
    'character': 'Персонаж',
    'brand': 'Бренд',
    'material': 'Материал',
    'size': 'Размер',
    'ageRestriction': 'Возраст',
    'rating': 'Рейтинг',
    'description': 'Описание'
  };
  
  return nameMap[prop] || prop.charAt(0).toUpperCase() + prop.slice(1);
};

export default Compare;
