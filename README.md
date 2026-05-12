# Promo App

Веб-сайт для пошуку та перегляду актуальних акцій і знижок у популярних українських супермаркетах - АТБ та Сільпо та інших.

---

## Про проєкт

Сервіс автоматично збирає дані про поточні акції з сайтів магазинів і показує їх в одному інтерфейсі. Користувач може фільтрувати пропозиції за магазином, переглядати ціни до та після знижки, а також відстежувати відсоток знижки.

---

## Стек технологій

- **Frontend** - React, React Router, Axios, Vite
- **Backend** - Node.js, Express
- **Database** - SQLite
- **Authorization** - JWT, bcrypt
- **Scraper** - Puppeteer, HTTPS API
- **DevOps** - Docker, Docker Compose, GitHub Actions

---

## Архітектура

```
promo-app/
├── backend/          # Node.js API сервер
│   ├── routes/       # Ендпоінти
│   ├── middleware/   # JWT-автентифікація, валідація
│   ├── scrapers/     # Скрапери
│   ├── services/     # Логіка збереження даних після скрапінгу
│   ├── migrations/   # Схема бази даних
│   └── seeds/        # Тестові дані
└── frontend/         # React SPA
    ├── pages/        # HomePage, LoginPage, AdminPage, ProfilePage...
    ├── components/   # Header, Footer, PromoCard
    └── styles/       # CSS для кожного компонента
```

---

## API

| Метод | Шлях | Доступ | Опис |
|---|---|---|---|
| GET | `/promos` | Публічний | Список акцій |
| GET | `/promos/:id` | Публічний | Одна акція |
| POST | `/promos` | Авторизований | Додати акцію вручну |
| PUT | `/promos/:id` | Авторизований | Оновити акцію |
| DELETE | `/promos/:id` | Авторизований | Видалити акцію |
| POST | `/promos/scrape/:store` | Адмін | Запустити скрапінг |
| GET | `/promos/stores` | Публічний | Список магазинів |
| GET | `/promos/categories` | Публічний | Список категорій |
| POST | `/auth/register` | Публічний | Реєстрація |
| POST | `/auth/login` | Публічний | Вхід, отримання JWT |
| GET | `/auth/me` | Авторизований | Дані поточного користувача |
| PUT | `/auth/profile` | Авторизований | Зміна імені та пошти |
| PUT | `/auth/password` | Авторизований | Зміна пароля |
| DELETE | `/auth/account` | Авторизований | Видалення акаунту |
| GET | `/health` | Публічний | Статус сервера |

---

## Запуск

### Через Docker
```bash
git clone https://github.com/mokhnatchuk/promo-app.git
cd promo-app
cp backend/.env.example backend/.env
docker compose up --build
```

Сервер запуститься на [http://localhost:3111](http://localhost:3111)

## Локальний запуск

```bash
cd backend
npm install
npx knex migrate:latest
npx knex seed:run
npm start
```

Фронтенд у режимі розробки:

```bash
cd frontend
npm install
npm run dev
```

---

## Змінні середовища

Потрібно скопіювати `backend/.env.example` у `backend/.env` і заповнити:

```
PORT=3111
NODE_ENV=development
JWT_SECRET=secret_key
```

Поля `DB_*` залишаються порожніми - сервіс використовує SQLite.

---

## Скрапер

Сервіс підтримує 2 джерела даних:

- **АТБ** - Puppeteer з плагіном stealth для обходу Cloudflare. Парсить сторінки акцій і товарів.
- **Сільпо** - Прямі запити до офіційного API. Парсить всі товари по кожній категорії.

Запуск скрапінгу вручну:

```bash
cd backend
npm run scrape atb
npm run scrape silpo
```

---

## Тести

```bash
cd backend
npm start
npm test
```

Тести перевіряють основні ендпоінти: `/health`, `/promos`, `/auth/me`, валідацію реєстрації та логіну.

---

## Команда

- [Василь](https://github.com/mokhnatchuk) — Backend / DevOps
- [Всеволод](https://github.com/savamix2013) — Frontend / BA
