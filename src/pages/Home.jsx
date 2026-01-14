import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Home.module.css';

function Home() {
  // Category data for the cards
  const categories = [
    { id: 1, name: 'Фигурки', image: '/src/assets/categories/figures.jpg', path: '/catalog?category=figurines', description: 'Коллекционные фигурки персонажей' },
    { id: 2, name: 'Книги', image: '/src/assets/categories/books.jpg', path: '/catalog?category=books', description: 'Манга, ранобэ и книги' },
    { id: 3, name: 'Одежда', image: '/src/assets/categories/clothing.jpg', path: '/catalog?category=clothing', description: 'Одежда и аксессуары' },
    { id: 4, name: 'Плакаты', image: '/src/assets/categories/posters.jpg', path: '/catalog?category=posters', description: 'Постеры' },
  ];
  // News data
  const news = [
    { id: 1, title: 'Новый сезон аниме My Hero Academia', date: '2023-06-15', content: 'Объявлено о новом сезоне популярного аниме My Hero Academia с выходом в следующем году.' },
    { id: 2, title: 'Распродажа в честь лета', date: '2023-06-10', content: 'Скидки до 50% на коллекционные фигурки в честь летнего сезона.' },
    { id: 3, title: 'Новые поступления', date: '2023-06-05', content: 'В продаже появились эксклюзивные товары из аниме Demon Slayer.' },
  ];

  return (
    <section className={styles.home}>
      <div className={styles.hero}>
        <h1>Добро пожаловать в Anime Shop!</h1>
        <p>Широкий выбор товаров для фанатов аниме и манги</p>
      </div>

      <div className={styles.cta}>
        <Link to="/catalog" className={styles.ctaButton}>Перейти в каталог</Link>
      </div>

      <div className={styles.categories}>
        <h2>Популярные категории</h2>
        <div className={styles.categoryGrid}>
          {categories.map(category => (
            <Link to={category.path} key={category.id} className={styles.categoryCard}>
              <div className={styles.categoryImage}>
                <img src={category.image} alt={category.name} />
              </div>
              <div className={styles.categoryInfo}>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.news}>
        <h2>Новости</h2>
        <div className={styles.newsList}>
          {news.map(item => (
            <div key={item.id} className={styles.newsItem}>
              <h3>{item.title}</h3>
              <p className={styles.date}>{item.date}</p>
              <p>{item.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Home;
