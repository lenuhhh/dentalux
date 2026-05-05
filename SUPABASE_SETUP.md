# 🗄️ Налаштування Supabase - Крок за кроком

## Етап 1: Створення проекту

### 1.1 Перейдіть на supabase.com
- Відкрийте https://supabase.com
- Нажміть **"Sign Up"** (або "Start for free")
- Виберіть **GitHub** для входу або створіть акаунт електронної пошти

### 1.2 Створіть новий проект
- Нажміть **"New Project"**
- Заповніть форму:
  - **Name**: `DentaLux` або інше ім'я
  - **Database Password**: Придумайте надійний пароль (збережіть його!)
  - **Region**: Виберіть найближчий до вас регіон (наприклад, `eu-central-1`)
- Нажміть **"Create new project"**
- Чекайте ~2-3 хвилини (проект ініціалізується)

### 1.3 Отримайте API ключи
- Після створення перейдіть в **Settings** (значок шестерні внизу зліва)
- Виберіть **API** у лівій панелі
- Знайдіть:
  - **Project URL** (починається з `https://`)
  - **anon public key** (довгий рядок)
- **Збережіть** ці значення

## Етап 2: Налаштування проекту React

### 2.1 Скопіюйте ключі
1. Відкрийте папку проекту (`c:\Users\Admin\Desktop\дента`)
2. Знайдіть файл `.env.example`
3. Скопіюйте його: `Ctrl+C` → Вставте: `Ctrl+V`
4. Перейменуйте копію на `.env.local`

### 2.2 Заповніть .env.local
Відкрийте файл `.env.local` у VS Code і замініть значення:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Замініть:
- `your-project-id` на ваш ID проекту (беріть з Project URL)
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` на ваш anon key

**Приклад:**
```env
VITE_SUPABASE_URL=https://zvxyzabcd1234567.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
```

## Етап 3: Створення таблиць в БД

### 3.1 Відкрийте SQL Editor
- Повернитися в Supabase
- Нажміть **SQL Editor** (лівий бар → лупа/редактор)
- Нажміть **"New Query"**

### 3.2 Скопіюйте SQL код
1. Відкрийте файл `sql-migrations.sql` у вашому проекті
2. Виділіть **весь** текст (Ctrl+A)
3. Скопіюйте (Ctrl+C)
4. Вставте в SQL Editor Supabase (Ctrl+V)

### 3.3 Запустіть SQL
- Нажміть **"Run"** (синя кнопка вгорі редактора)
- Чекайте виконання (має не бути помилок)
- Знизу з'являться повідомлення: `"Table user_profiles created"` і т.д.

### 3.4 Перевірте таблиці
- Перейдіть в **Table Editor** (лівий бар)
- Ви повинні побачити 6 таблиць:
  - ✅ `user_profiles`
  - ✅ `services` (з 6 послугами)
  - ✅ `appointments`
  - ✅ `treatment_history`
  - ✅ `doctors` (3 лікарі)
  - ✅ `reviews`

## Етап 4: Перезапуск додатку

### 4.1 Перезавантажте React
```bash
# У터미налі, перейдіть до папки проекту
cd c:\Users\Admin\Desktop\дента

# Зупиніть старий dev сервер (Ctrl+C якщо запущений)

# Запустіть заново
npm run dev
```

### 4.2 Тестуйте в браузері
1. Відкрийте http://localhost:5174 (або http://192.168.0.103:5174)
2. Перейдіть на `/register`
3. Зареєструйтеся новим акаунтом
4. Перейдіть на `/cabinet`
5. Ви повинні побачити своїм данні (ім'я, електронна пошта)

## Етап 5: RLS (Безпека)

У файлі `sql-migrations.sql` вже налаштовані RLS політики:

- **Користувачі** можуть видяти/редагувати **лише свої** дані
- **Послуги** та **лікарі** видні **всім**
- **Прийоми** видні **лише їх власникам**

Якщо RLS не працює, перейдіть в **Authentication → Policies** і перевірте.

## Трубешутинг

### Помилка: "Invalid API key"
- Перевірте, що `.env.local` був створений **після** старту dev сервера
- Перезапустіть сервер: `npm run dev`

### Помилка: "Database connection failed"
- Перевірте URL (має бути `https://`, не `http://`)
- Переконайтеся, що `VITE_SUPABASE_URL` містить `.supabase.co`

### Таблиці не видно в Table Editor
- Перевірте, що SQL запит запущився без помилок
- Нажміть **"Refresh"** кнопку в Table Editor

### Реєстрація не працює
- Перевірте, що таблиця `user_profiles` створена
- Відкрийте DevTools (F12) → Console для просмотру помилок
- Дивіться помилки Supabase

### Особистий кабінет показує "Завантаження..."
- Могло пройти 2-3 секунди - чекайте
- Якщо помилка залишається, перевірте Console (F12)

## Допоміжні команди

### Перезавантажити dev сервер
```bash
npm run dev
```

### Збудувати для продакшену
```bash
npm run build
npm run preview
```

### Очистити node_modules і переінстальовані залежності
```bash
rm -r node_modules package-lock.json
npm install
```

## Додаткові ресурси

- **Документація Supabase**: https://supabase.com/docs
- **React Router**: https://reactrouter.com/
- **Vite**: https://vitejs.dev/

## Підтримувані операції в БД

Після налаштування, вы можете користуватися:

✅ **Реєстрація** - Створюється профіль у `user_profiles`  
✅ **Вхід** - Аутентифікація через Supabase Auth  
✅ **Запис на прием** - Зберігається в таблиці `appointments`  
✅ **Профіль** - Читання/редагування в `user_profiles`  
✅ **Історія** - Перегляд у `treatment_history`  

---

**Якщо виникли проблеми, перевірте Console в браузері (F12) для деталей помилок.**
