import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PromoCard from '../components/PromoCard';

import '../styles/home-page.css';

const HomePage = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const stores = ['All', 'ATB', 'Silpo', 'Fora', 'Auchan', 'Novus'];

  useEffect(() => {
    const fetchPromos = async () => {
      setLoading(true);
      try {
        const url =
          selectedStore && selectedStore !== 'All'
            ? `/promos?store=${selectedStore}&page=${currentPage}&limit=20`
            : `/promos?page=${currentPage}&limit=20`;

        const response = await axios.get(url);

        // Безпечно перевіряємо, де саме лежить масив акцій
        if (response.data.data && Array.isArray(response.data.data)) {
          setPromos(response.data.data);
          if (response.data.pagination) {
            // Підтримка обох варіантів (camelCase та snake_case) для безпеки
            setTotalPages(
              response.data.pagination.total_pages ||
                response.data.pagination.totalPages ||
                1
            );
          }
        } else if (Array.isArray(response.data)) {
          setPromos(response.data);
        } else if (
          response.data.promos &&
          Array.isArray(response.data.promos)
        ) {
          setPromos(response.data.promos);
        } else {
          console.warn('Не знайшли масив акцій у відповіді:', response.data);
          setPromos([]);
        }
      } catch (error) {
        console.error('Помилка при завантаженні даних:', error);
        setPromos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPromos();
  }, [selectedStore, currentPage]);

  const handleStoreSelect = store => {
    setSelectedStore(store);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <div className="home-page">
      {/* Навігаційна панель (Navbar) - візуально */}
      <div className="home-navbar">
        <div className="logo"></div>
        <input
          type="text"
          className="search-input"
          placeholder="Пошук акцій..."
        />
      </div>

      <div className="home-content">
        {/* Бічна панель фільтрів (FilterSidebar) */}
        <aside className="filter-sidebar">
          <h3>Магазини</h3>
          {stores.map(store => (
            <div
              key={store}
              className={`store-card ${selectedStore === store ? 'active' : ''}`}
              onClick={() => handleStoreSelect(store)}
            >
              {store === 'All' ? 'Всі магазини' : store}
            </div>
          ))}
        </aside>

        {/* Контейнер з карточками та пагінацією */}
        <main className="promos-container">
          <div className="promos-grid">
            {loading ? (
              <p className="no-promos">Завантаження акцій...</p>
            ) : promos.length === 0 ? (
              <p className="no-promos">Акції не знайдено</p>
            ) : (
              promos.map(promo => (
                <PromoCard key={promo.id || promo.url} promo={promo} />
              ))
            )}
          </div>

          {/* Пагінація */}
          {!loading && totalPages > 1 && (
            <div className="pagination">
              <button onClick={handlePrevPage} disabled={currentPage === 1}>
                Назад
              </button>
              <span>
                Сторінка {currentPage} з {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Вперед
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HomePage;
