import { useState } from 'react';
import '../styles/admin-page.css';

function AdminPage() {
  const [formData, setFormData] = useState({
    title: '',
    shop: '',
    discount: '',
    price: '',
    expiresAt: '',
  });

  const [promos, setPromos] = useState([
    { id: 1, title: 'Знижка на молоко', shop: 'Сільпо', discount: '30%' },
  ]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (
      formData.title &&
      formData.shop &&
      formData.discount &&
      formData.price
    ) {
      const newPromo = {
        id: promos.length + 1,
        title: formData.title,
        shop: formData.shop,
        discount: formData.discount + '%',
        price: formData.price,
      };
      setPromos([...promos, newPromo]);
      setFormData({
        title: '',
        shop: '',
        discount: '',
        price: '',
        expiresAt: '',
      });
      alert('✅ Акція додана успішно!');
    } else {
      alert('⚠️ Заповніть усі поля');
    }
  };

  return (
    <div className="admin-page">
      <h2>⚙️ Адмін-панель</h2>

      <section className="add-promo">
        <h3>➕ Додати нову акцію</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            placeholder="Назва акції"
            value={formData.title}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="shop"
            placeholder="Магазин"
            value={formData.shop}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="discount"
            placeholder="Знижка (%)"
            min="0"
            max="100"
            value={formData.discount}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="price"
            placeholder="Ціна (грн)"
            value={formData.price}
            onChange={handleChange}
            required
          />
          <input
            type="date"
            name="expiresAt"
            value={formData.expiresAt}
            onChange={handleChange}
          />
          <button type="submit" className="submit-btn">
            Додати
          </button>
        </form>
      </section>

      <section className="promo-list">
        <h3>📋 Список акцій</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Назва</th>
              <th>Магазин</th>
              <th>Знижка</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {promos.map(promo => (
              <tr key={promo.id}>
                <td>{promo.id}</td>
                <td>{promo.title}</td>
                <td>{promo.shop}</td>
                <td>{promo.discount}</td>
                <td>
                  <button className="delete-btn">❌ Видалити</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default AdminPage;
