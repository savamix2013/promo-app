import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
  // Замінили username на email
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const response = await axios.post('/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Невірний email або пароль');
    }
  };

  return (
    <div
      className="auth-container"
      style={{ padding: '20px', maxWidth: '300px', margin: '0 auto' }}
    >
      <h2>Вхід</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
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
        <button type="submit">Увійти</button>
      </form>
      <p>
        Немає акаунту? <Link to="/register">Зареєструватися</Link>
      </p>
    </div>
  );
};

export default LoginPage;
