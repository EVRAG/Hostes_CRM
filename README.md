### Restaurant CRM (v1)

Полноценный MVP CRM для ресторанов: фронтенд (React + Vite + Tailwind), бэкенд (FastAPI), PostgreSQL, Redis. Запуск в Docker Compose. Есть авторизация (JWT), просмотр слотов и создание бронирований.

### Быстрый старт

1. Установите Docker и Docker Compose.
2. В корне проекта выполните:

```bash
docker-compose up --build
```

3. Откройте `http://localhost:5173`.
4. Войдите: логин `admin`, пароль `password123`.

### Структура

- `frontend/` — React + Vite + Tailwind UI
- `backend/` — FastAPI + SQLAlchemy + Redis + JWT
- `docker-compose.yml` — запуск всех сервисов

### Переменные окружения

Можно переопределить через `.env` или переменные среды при запуске:

- **Backend**
  - `DB_URL` (по умолчанию `postgresql+asyncpg://crm_user:crm_password@db:5432/crm_db`)
  - `REDIS_URL` (по умолчанию `redis://redis:6379/0`)
  - `JWT_SECRET` (по умолчанию `supersecretjwt`)
  - `JWT_ALGORITHM` (по умолчанию `HS256`)
  - `ADMIN_USERNAME` (по умолчанию `admin`)
  - `ADMIN_PASSWORD` (по умолчанию `password123`)
  - `FRONTEND_ORIGIN` (по умолчанию `http://localhost:5173`)
  - `OPENAI_API_KEY` (ключ OpenAI, обязателен для работы чата ассистента)
- **Frontend**
  - `VITE_API_URL` (по умолчанию `http://localhost:8000`)
  - `VITE_ASSISTANT_ID` (ID ассистента OpenAI для чата, по умолчанию демо ID)

### База данных

Таблицы:

- `restaurants`
  - `id` (PK)
  - `name`
  - `default_table_count` (int, дефолтно 5)
- `bookings`
  - `id` (PK)
  - `restaurant_id` (FK -> restaurants.id)
  - `date` (date)
  - `time_slot` (string, например `18:00`)
  - `client_name` (string)

При первом старте создается ресторан `id=1` с `default_table_count=5`.

### API

Базовый URL: `http://localhost:8000`

- **Авторизация**
  - `POST /auth/login`
    - Вход: `{ "username": "admin", "password": "password123" }`
    - Ответ: `{ "access_token": "...", "token_type": "bearer" }`
- **Слоты по дате**
  - `GET /bookings/{restaurant_id}/{date}` (требует Header `Authorization: Bearer <token>`)
  - Пример: `/bookings/1/2025-01-01`
  - Ответ: `{ restaurant_id, date, slots: [{ time, booked, free }] }`
  - Кэшируется в Redis ключом `slots:{restaurant_id}:{date}` на 1 час
- **Создание бронирования**
  - `POST /bookings` (требует Header `Authorization: Bearer <token>`)
  - Вход: `{ "restaurant_id": 1, "date": "2025-01-01", "time_slot": "18:00", "client_name": "Иван" }`
  - Ответ: `{ "status": "ok", "booking_id": <id> }`

- **Настройки ресторана**
  - `GET /restaurants/{restaurant_id}/settings` (JWT)
    - Ответ: `{ restaurant_id, host_choice, greeting_text, info_text }`
  - `PUT /restaurants/{restaurant_id}/settings` (JWT)
    - Вход: `{ host_choice: string|null, greeting_text: string|null, info_text: string|null }`
    - Ответ: `{ restaurant_id, host_choice, greeting_text, info_text }`

- **Чат ассистента (OpenAI Assistants v2, прокси)**
  - `POST /assistants/chat` (JWT)
    - Вход: `{ assistant_id: string, message: string, thread_id?: string }`
    - Ответ: `{ thread_id: string, assistant_message: string }`
    - Требуется переменная окружения `OPENAI_API_KEY` на бэкенде.
  - `POST /assistants/chat_stream` (JWT, Server-Sent Events)
    - Возвращает поток `text/event-stream` с событиями вида `data: { "delta": "..." }` и финальным `data: { "done": true, "thread_id": "..." }`
    - Используется на фронтенде для показа ответа ассистента в режиме стриминга.

### Кэш Redis

- Ключи: `slots:{restaurant_id}:{date}`
- Значение: JSON со списком `{ time: "18:00", booked: 2, free: 3 }`
- TTL: 3600 секунд

### UI

- Светлые оттенки, аккуратные отступы, скругленные углы
- Сайдбар с разделами: Бронирования, Настройки, Дашборд
- Бронирования: календарь выбора даты и список слотов с модалкой для создания брони

### Масштабирование и архитектура

- Подготовлена структура для будущих мульти-ресторанных аккаунтов: токен включает `restaurant_id`, таблица `restaurants`, связь с `bookings`.
- В дальнейшем можно добавить регистрацию ресторанов, пользователей и роли, а также RBAC и реальный многопользовательский логин.

### Разработка без Docker

- Backend
  ```bash
  cd backend
  python -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt
  export DB_URL=postgresql+asyncpg://crm_user:crm_password@localhost:5432/crm_db
  export REDIS_URL=redis://localhost:6379/0
  uvicorn app.main:app --reload
  ```
- Frontend
  ```bash
  cd frontend
  npm i
  npm run dev
  ```

### Postman

- Коллекция для тестирования API находится в `postman/Restaurant_CRM.postman_collection.json`.
- Переменные окружения в коллекции:
  - `baseUrl` (по умолчанию `http://localhost:8000`)
  - `restaurantId` (по умолчанию `1`)
  - `date` (пример `2025-01-01`)
  - `assistantId` (ID ассистента OpenAI)
  - `threadId` (заполняется автоматически после первого запроса к ассистенту)
  - `token` (заполняется автоматически после логина)

### Лицензия

MIT

