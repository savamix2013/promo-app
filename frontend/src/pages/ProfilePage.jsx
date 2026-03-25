import { useState } from 'react';
import '../styles/profile-page.css';

function ProfilePage() {
  const [user, setUser] = useState({
    name: 'Іван Петренко',
    email: 'ivan@example.com',
    phone: '+380 50 123 45 67',
    city: 'Київ',
  });

  const [savedPromos, setSavedPromos] = useState([
    { id: 1, title: 'Знижка на молоко', shop: 'Сільпо' },
    { id: 2, title: 'Пакет соків', shop: 'АТБ' },
  ]);

  return (
    <div className="profile-page">
      <section className="profile-section">
        <h2>👤 Мій профіль</h2>
        <div className="profile-info">
          <p>
            <strong>Ім'я:</strong> {user.name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Телефон:</strong> {user.phone}
          </p>
          <p>
            <strong>Місто:</strong> {user.city}
          </p>
        </div>
        <button className="edit-button">Редагувати профіль</button>
      </section>

      <section className="saved-promos">
        <h3>💾 Збережені акції ({savedPromos.length})</h3>
        <ul className="saved-list">
          {savedPromos.map(promo => (
            <li key={promo.id}>
              <span>{promo.title}</span>
              <span className="shop-badge">{promo.shop}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default ProfilePage;
