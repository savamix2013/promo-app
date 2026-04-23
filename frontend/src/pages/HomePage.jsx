import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PromoCard from '../components/PromoCard';

import '../styles/home-page.css';

const HomePage = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState('All');

  useEffect(() => {
    const fetchPromos = async () => {
      setLoading(true);
      try {
        const url =
          selectedStore && selectedStore !== 'All'
            ? `/promos?store=${selectedStore}`
            : '/promos';

        const response = await axios.get(url);

        console.log('Відповідь від сервера:', response.data);

        // Безпечно перевіряємо, де саме лежить масив акцій
        if (Array.isArray(response.data)) {
          setPromos(response.data);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          setPromos(response.data.data);
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
  }, [selectedStore]);

  return (
    <div>
      {/* Селект для фільтрації по магазинах */}
      <div style={{ marginBottom: '20px', padding: '10px' }}>
        <label style={{ marginRight: '10px' }}>Виберіть магазин: </label>
        <select
          value={selectedStore}
          onChange={e => setSelectedStore(e.target.value)}
          style={{ padding: '5px', borderRadius: '5px' }}
        >
          <option value="All">Всі</option>
          <option value="ATB">ATB</option>
          <option value="Silpo">Сільпо</option>
        </select>
      </div>

      {/* Контейнер з карточками */}
      <div className="promos-container">
        {loading ? (
          <p>Завантаження акцій...</p>
        ) : promos.length === 0 ? (
          <p>Акції не знайдено</p>
        ) : (
          promos.map(promo => (
            <PromoCard key={promo.id || promo.url} promo={promo} />
          ))
        )}
      </div>
    </div>
  );
};

export default HomePage;
