import { useState } from 'react';
import PromoCard from '../components/PromoCard';
import '../styles/home-page.css';

function HomePage() {
  const [promos, setPromos] = useState([
    {
      id: 1,
      title: 'Знижка на молоко',
      shop: 'Сільпо',
      discount: 30,
      price: '45',
      expiresAt: '31.03.2026',
    },
    {
      id: 2,
      title: 'Пакет соків (6 шт)',
      shop: 'АТБ',
      discount: 25,
      price: '89 ',
      expiresAt: '30.03.2026',
    },
    {
      id: 3,
      title: 'Хлібобулочні вироби',
      shop: 'Novus',
      discount: 15,
      price: '12 ',
      expiresAt: '29.03.2026',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState('all');

  const filteredPromos = promos.filter(
    promo =>
      promo.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedShop === 'all' || promo.shop === selectedShop),
  );

  return (
    <div className="home-page">
      <section className="hero">
        <h2>Знайди найкращі акції у своєму місті</h2>
        <p>Економія починається тут</p>
      </section>

      <section className="filters">
        <input
          type="text"
          placeholder="🔍 Пошук акцій..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="search-input"
        />

        <select
          value={selectedShop}
          onChange={e => setSelectedShop(e.target.value)}
          className="shop-filter"
        >
          <option value="all">Усі магазини</option>
          <option value="Сільпо">Сільпо</option>
          <option value="АТБ">АТБ</option>
          <option value="Novus">Novus</option>
        </select>
      </section>

      <section className="promos-grid">
        {filteredPromos.length > 0 ? (
          filteredPromos.map(promo => <PromoCard key={promo.id} {...promo} />)
        ) : (
          <p className="no-promos">Акції не знайдені 😞</p>
        )}
      </section>
    </div>
  );
}

export default HomePage;
