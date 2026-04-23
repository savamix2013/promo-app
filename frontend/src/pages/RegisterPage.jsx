import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
  // Додали name і замінили username на email
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('/auth/register', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка реєстрації');
    }
  };

  return (
    <div
      className="auth-container"
      style={{ padding: '20px', maxWidth: '300px', margin: '0 auto' }}
    >
      <h2>Реєстрація</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
        <input
          type="text"
          placeholder="Ваше ім'я"
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          onChange={e => setFormData({ ...formData, password: e.target.value })}
          required
        />
        <button type="submit">Створити акаунт</button>
      </form>
      <p>
        Вже маєте акаунт? <Link to="/login">Увійти</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
