# 📚 Рекомендації та розгортання

## Локальна розробка

### Запуск dev сервера
```bash
npm run dev
```
Доступно на: **http://localhost:5174** або **http://192.168.0.103:5174**

### Перевірка помилок
```bash
npm run build
```
Якщо помилок немає - код готовий до продакшену!

## Розгортання на хостинг

### Варіант 1: Vercel (рекомендується)
1. Нажміть https://vercel.com/import
2. Виберіть GitHub репозиторій
3. Заповніть Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Нажміть Deploy

### Варіант 2: Netlify
1. Нажміть https://app.netlify.com/start
2. Виберіть GitHub, GitLab або Bitbucket
3. Налаштуйте build:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Додайте Environment Variables (в Netlify Settings)
5. Deploy!

### Варіант 3: GitHub Pages
```bash
# 1. Побудуйте проект
npm run build

# 2. Скопіюйте папку dist на сервер або GitHub Pages
```

### Варіант 4: Свій VPS (Linux/Ubuntu)
```bash
# На сервері:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
git clone https://github.com/your-repo.git
cd your-repo

# Налаштуйте .env
nano .env.local
# Вставте: VITE_SUPABASE_URL=...
# Вставте: VITE_SUPABASE_ANON_KEY=...

# Встановіть залежності
npm install

# Збудуйте
npm run build

# Запустіть з PM2
npm install -g pm2
pm2 start "npm run preview" --name dentaLux
pm2 save
```

## Оптимізація для продакшену

### 1. Перевірте build розмір
```bash
npm run build
# Подивіться на розмір файлів у dist/
```

Цільові розміри:
- ✅ HTML: < 2 kB
- ✅ CSS: < 15 kB (gzip < 3 kB)
- ✅ JS: < 450 kB (gzip < 120 kB)

### 2. Кешування у браузері
Додайте в `.env`:
```env
VITE_APP_CACHE_VERSION=1.0.0
```

### 3. Monitoring помилок
Підключіть Sentry або LogRocket:
```javascript
// src/main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

## SEO оптимізація

Додано в `index.html`:
```html
<meta name="description" content="ДентаЛюкс - преміальна стоматологія в Києві" />
<meta name="theme-color" content="#1C3D2E" />
```

### Додаткові рекомендації:

1. **Robots.txt**
```txt
User-agent: *
Allow: /
Sitemap: https://dentalux.com/sitemap.xml
```

2. **Sitemap.xml**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://dentalux.com</loc></url>
  <url><loc>https://dentalux.com/#/services</loc></url>
  <url><loc>https://dentalux.com/#/appointment</loc></url>
</urlset>
```

3. **Open Graph теги** (для соціальних мереж)
```html
<meta property="og:title" content="ДентаЛюкс | Преміальна стоматологія" />
<meta property="og:description" content="Лучшие врачи, современное оборудование, персональный подход" />
<meta property="og:image" content="https://dentalux.com/og-image.jpg" />
```

## Безпека

### 1. HTTPS
- ✅ Vercel/Netlify автоматично забезпечують HTTPS
- На власному сервері: встановіть Let's Encrypt

### 2. CORS (для API)
Якщо користуватиметеся зовнішнім API, додайте в `vite.config.js`:
```javascript
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://your-api.com',
        changeOrigin: true,
      }
    }
  }
}
```

### 3. Rate Limiting
На сервері Supabase:
- Перейдіть в **Auth → Rate Limiting**
- Встановіть максимум спроб входу (за замовчуванням: 15/хвилину)

### 4. Валідація вводу
✅ Всі форми мають базову валідацію  
✅ Supabase RLS захищає дані на рівні БД  
✅ Додайте server-side валідацію на власному бекенді

## Моніторинг

### Google Analytics
```javascript
// src/main.jsx
import { useEffect } from 'react';

useEffect(() => {
  // Додайте Google Analytics скрипт
  const script = document.createElement('script');
  script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_ID';
  document.head.appendChild(script);
  
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
}, []);
```

### Supabase Logs
- Перейдіть в **Logs** в Supabase Dashboard
- Дивіться всі запити до БД та помилки

## Резервні копії

### Резервна копія Supabase
1. Перейдіть в **Settings → Backups**
2. Нажміть **"Create backup"**
3. Автоматичні резервні копії - щоденно

### Експорт даних
```bash
# Експортувати дані з Supabase
npx supabase db dump --db-url $DB_URL > backup.sql
```

## Масштабування

Коли користувачів > 1000:

1. **Добавьте Index на популярні поля**
   - `user_id` в таблиці `appointments`
   - `appointment_date` для швидкого пошуку

2. **Увімкніть кешування**
   ```javascript
   // У supabaseClient.js
   const { data } = await supabase
     .from('doctors')
     .select('*')
     .cache('doctors', 3600) // Кешувати на 1 годину
   ```

3. **Підключіть CDN**
   - Vercel/Netlify: вбудована CDN
   - Власний сервер: Cloudflare

## Оновлення залежностей

Щомісячно перевіряйте оновлення:
```bash
npm outdated
npm update
npm audit fix
```

## Контрольний список перед публікацією

- [ ] ✅ Всі сторінки тестовані локально
- [ ] ✅ `npm run build` успішна без помилок
- [ ] ✅ `.env` змінні встановлені
- [ ] ✅ Supabase RLS політики налаштовані
- [ ] ✅ HTTPS увімкнено
- [ ] ✅ Фавікон показується
- [ ] ✅ Мобільна версія виглядає нормально (F12 → Responsive)
- [ ] ✅ Реєстрація/вхід працюють
- [ ] ✅ Особистий кабінет завантажує дані
- [ ] ✅ Запис на прием зберігається в БД

---

**Готово до запуску! 🚀**
