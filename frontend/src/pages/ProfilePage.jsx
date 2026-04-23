import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// import '../styles/profile-page.css'; // Розкоментуй, якщо маєш файл зі стилями для профілю

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      // 1. Дістаємо токен з локального сховища
      const token = localStorage.getItem('token');

      // 2. Якщо токена немає взагалі — відправляємо на логін
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // 3. Робимо запит до бекенду, додаючи токен у заголовки
        const response = await axios.get('/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // 4. Зберігаємо отримані дані користувача
        setUser(response.data.data);
      } catch (err) {
        console.error('Помилка завантаження профілю:', err);
        setError(
          'Сесія закінчилася або помилка сервера. Будь ласка, увійдіть знову.',
        );

        // Якщо токен недійсний або прострочений - чистимо сміття і на логін
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  // Додамо кнопку виходу (це дуже зручно для профілю)
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Завантаження профілю...</p>
      </div>
    );
  }

  return (
    <div
      className="profile-container"
      style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}
    >
      <h2>Мій профіль</h2>

      {error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : user ? (
        <div
          className="user-info"
          style={{
            background: '#f9f9f9',
            padding: '15px',
            borderRadius: '8px',
          }}
        >
          <p>
            <strong>Ім'я:</strong> {user.name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Роль:</strong>{' '}
            {user.role === 'admin' ? 'Адміністратор' : 'Користувач'}
          </p>

          <button
            onClick={handleLogout}
            style={{
              marginTop: '20px',
              padding: '10px 15px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Вийти з акаунта
          </button>
        </div>
      ) : (
        <p>Користувача не знайдено</p>
      )}
    </div>
  );
};

export default ProfilePage;
