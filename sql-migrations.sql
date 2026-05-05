-- Таблица пользователей (расширение auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  birth_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица услуг
CREATE TABLE IF NOT EXISTS services (
  id BIGSERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(5) DEFAULT '₴',
  duration VARCHAR(50),
  image_url TEXT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица записей на приём
CREATE TABLE IF NOT EXISTS appointments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id BIGINT REFERENCES services(id),
  appointment_date DATE NOT NULL,
  appointment_time VARCHAR(20) NOT NULL,
  doctor_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Міграція: додати нові поля (для вже існуючих таблиць)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS service_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS patient_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS patient_phone VARCHAR(30),
  ADD COLUMN IF NOT EXISTS patient_email VARCHAR(255);

-- Таблица истории лечения
CREATE TABLE IF NOT EXISTS treatment_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id BIGINT REFERENCES services(id),
  appointment_id BIGINT REFERENCES appointments(id),
  doctor_name VARCHAR(255),
  treatment_date DATE NOT NULL,
  cost DECIMAL(10, 2),
  currency VARCHAR(5) DEFAULT '₴',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE treatment_history
  ADD COLUMN IF NOT EXISTS procedure_name VARCHAR(255);

-- Таблица врачей
CREATE TABLE IF NOT EXISTS doctors (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  experience_years INT,
  bio TEXT,
  photo_url TEXT,
  specialties TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица отзывов
CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id BIGINT REFERENCES appointments(id),
  rating INT DEFAULT 5,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_treatment_history_user_id ON treatment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Политики доступа
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own treatment history" ON treatment_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view services" ON services
  FOR SELECT USING (true);

CREATE POLICY "Everyone can view doctors" ON doctors
  FOR SELECT USING (true);

-- Вставка примеров услуг
INSERT INTO services (category, title, description, price, duration, details) VALUES
('Терапія', 'Лікування карієсу', 'Сучасне лікування карієсу з композитних матеріалів', 2900, '40 хвилин', 'Лікування без фреза, мікроскоп для максимальної точності'),
('Терапія', 'Лікування каналів', 'Ендодонтія під мікроскопом з гарантією', 4500, '90 хвилин', 'Повне очищення та герметизація корективних каналів'),
('Естетика', 'Професійне відбілювання', 'Яскрава посмішка за одну процедуру', 3500, '60 хвилин', 'Відбілювання лазером або LED-світлом дає результат до 8 тонів'),
('Естетика', 'Вініри', 'Мікро-вініри з натуральним виглядом', 12000, '2 сеанси', 'Тонкі керамічні накладки трансформують форму та колір'),
('Імплантація', 'Імплант з коронкою', 'Повна заміна втраченого зуба', 45000, '5-6 місяців', 'Імплант з коронкою з циркону. Гарантія на роботу до 5 років'),
('Ортодонтія', 'Елайнери Invisalign', 'Невидимі брекети за комфортною ціною', 34000, '8-12 місяців', 'Система прозорих капп для випрямлення зубів без видимих брекетів')
ON CONFLICT DO NOTHING;

-- Вставка примеров врачей
INSERT INTO doctors (name, role, experience_years, bio, specialties) VALUES
('Андрій Кравченко', 'Головний лікар, імплантолог', 12, 'Дбайлива хірургія, складні клінічні випадки', ARRAY['Імплантація', 'Хірургія']),
('Михайло Осипов', 'Ортопед-гнатолог', 10, 'Відновлення прикусу та естетики при стиранні', ARRAY['Ортопедія', 'Гнатологія']),
('Катерина Романова', 'Ортодонт', 8, 'Елайнери, ортодонтія для дітей та дорослих', ARRAY['Ортодонтія', 'Педодонтія'])
ON CONFLICT DO NOTHING;

-- Додаткові idempotent-кроки для auth/кабінету
-- 1) insert профілю (потрібно для першого збереження/створення профілю)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
      AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON user_profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 2) update запису (потрібно для скасування запису в кабінеті)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'appointments'
      AND policyname = 'Users can update own appointments'
  ) THEN
    CREATE POLICY "Users can update own appointments" ON appointments
      FOR UPDATE USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 3) автозаповнення user_profiles після реєстрації
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- Розширення функціоналу (slots, reminder, waitlist, cabinet+, content)
-- =========================================

CREATE TABLE IF NOT EXISTS doctor_slots (
  id BIGSERIAL PRIMARY KEY,
  doctor_id BIGINT REFERENCES doctors(id),
  doctor_name VARCHAR(255),
  service_name VARCHAR(255),
  slot_date DATE NOT NULL,
  slot_time VARCHAR(20) NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  is_emergency BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_doctor_slots_unique ON doctor_slots(doctor_name, slot_date, slot_time);
CREATE INDEX IF NOT EXISTS idx_doctor_slots_date_booked ON doctor_slots(slot_date, is_booked);

CREATE TABLE IF NOT EXISTS appointment_waitlist (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name VARCHAR(255) NOT NULL,
  preferred_date DATE,
  preferred_time_range VARCHAR(50),
  note TEXT,
  status VARCHAR(30) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reminder_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  telegram_enabled BOOLEAN DEFAULT false,
  telegram_chat_id VARCHAR(128),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reminder_jobs (
  id BIGSERIAL PRIMARY KEY,
  appointment_id BIGINT REFERENCES appointments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  channel VARCHAR(30) DEFAULT 'email',
  status VARCHAR(30) DEFAULT 'pending',
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reminder_jobs_queue ON reminder_jobs(status, remind_at);

CREATE TABLE IF NOT EXISTS patient_documents (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  doc_type VARCHAR(100),
  file_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS treatment_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  stage VARCHAR(100) DEFAULT 'planned',
  progress_percent INT DEFAULT 0,
  estimated_cost DECIMAL(10,2),
  next_step TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prevention_programs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  checkup_every_months INT DEFAULT 6,
  last_checkup_date DATE,
  next_checkup_date DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loyalty_accounts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  points INT DEFAULT 0,
  tier VARCHAR(50) DEFAULT 'Start',
  referral_code VARCHAR(50),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referral_events (
  id BIGSERIAL PRIMARY KEY,
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points_awarded INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_invoices (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'UAH',
  status VARCHAR(30) DEFAULT 'pending',
  provider VARCHAR(50) DEFAULT 'manual',
  external_id VARCHAR(255),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clinic_cases (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  problem VARCHAR(255) NOT NULL,
  before_image_url TEXT,
  after_image_url TEXT,
  description TEXT,
  duration VARCHAR(100),
  doctor_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS symptom_guides (
  id BIGSERIAL PRIMARY KEY,
  symptom VARCHAR(255) NOT NULL,
  urgency VARCHAR(50) DEFAULT 'normal',
  what_to_do TEXT,
  service_name VARCHAR(255),
  priority INT DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  excerpt TEXT,
  content TEXT,
  cover_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consult_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  preferred_time VARCHAR(100),
  message TEXT,
  status VARCHAR(30) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ab_test_events (
  id BIGSERIAL PRIMARY KEY,
  experiment_key VARCHAR(100) NOT NULL,
  variant VARCHAR(30) NOT NULL,
  event_name VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RLS enable
ALTER TABLE appointment_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE prevention_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE consult_requests ENABLE ROW LEVEL SECURITY;

-- Idempotent policies for new tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='appointment_waitlist' AND policyname='Users manage own waitlist') THEN
    CREATE POLICY "Users manage own waitlist" ON appointment_waitlist
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reminder_preferences' AND policyname='Users manage own reminder preferences') THEN
    CREATE POLICY "Users manage own reminder preferences" ON reminder_preferences
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reminder_jobs' AND policyname='Users view own reminder jobs') THEN
    CREATE POLICY "Users view own reminder jobs" ON reminder_jobs
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='patient_documents' AND policyname='Users manage own documents') THEN
    CREATE POLICY "Users manage own documents" ON patient_documents
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='treatment_plans' AND policyname='Users view own treatment plans') THEN
    CREATE POLICY "Users view own treatment plans" ON treatment_plans
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='prevention_programs' AND policyname='Users manage own prevention program') THEN
    CREATE POLICY "Users manage own prevention program" ON prevention_programs
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='loyalty_accounts' AND policyname='Users view own loyalty') THEN
    CREATE POLICY "Users view own loyalty" ON loyalty_accounts
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_invoices' AND policyname='Users manage own invoices') THEN
    CREATE POLICY "Users manage own invoices" ON payment_invoices
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='consult_requests' AND policyname='Users can create consult requests') THEN
    CREATE POLICY "Users can create consult requests" ON consult_requests
      FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

-- Public-readable content tables
ALTER TABLE clinic_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clinic_cases' AND policyname='Everyone can view clinic cases') THEN
    CREATE POLICY "Everyone can view clinic cases" ON clinic_cases FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='symptom_guides' AND policyname='Everyone can view symptom guides') THEN
    CREATE POLICY "Everyone can view symptom guides" ON symptom_guides FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blog_posts' AND policyname='Everyone can view published posts') THEN
    CREATE POLICY "Everyone can view published posts" ON blog_posts FOR SELECT USING (is_published = true);
  END IF;
END $$;

-- Seed content MVP
INSERT INTO clinic_cases (title, problem, before_image_url, after_image_url, description, duration, doctor_name) VALUES
('Кейс 01: Естетичне відновлення', 'Скол і потемніння', 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1606265752439-1f18756aa5fc?auto=format&fit=crop&w=800&q=80', 'Комплексна реставрація фронтальної групи зубів.', '14 днів', 'Михайло Осипов'),
('Кейс 02: Імплантація', 'Відсутній зуб', 'https://images.unsplash.com/photo-1588776814546-ec7e57f9f3f9?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=800&q=80', 'Імплант Nobel + цирконієва коронка.', '4 місяці', 'Андрій Кравченко')
ON CONFLICT DO NOTHING;

INSERT INTO symptom_guides (symptom, urgency, what_to_do, service_name, priority) VALUES
('Болить зуб при натисканні', 'high', 'Не грійте щоку, зверніться на огляд сьогодні або завтра.', 'Лікування каналів', 10),
('Кровоточать ясна', 'normal', 'Запишіться на професійну гігієну та консультацію пародонтолога.', 'Професійна гігієна', 20),
('Скол зуба', 'high', 'Уникайте твердої їжі, запишіться на реставрацію найближчим часом.', 'Консультація', 15)
ON CONFLICT DO NOTHING;

INSERT INTO blog_posts (title, slug, excerpt, content, cover_url, tags) VALUES
('Що буде на першому прийомі у стоматолога', 'first-visit-guide', 'Коротко про етапи першого візиту і як підготуватися.', 'Перший прийом включає консультацію, огляд, за потреби діагностику та попередній план лікування.', 'https://images.unsplash.com/photo-1588776814546-ec7e57f9f3f9?auto=format&fit=crop&w=1200&q=80', ARRAY['гайд','перший візит']),
('Як підготуватися до імплантації', 'implant-prep', '5 простих кроків перед процедурою.', 'Перед імплантацією важливо пройти КТ, консультацію і погодити план реабілітації.', 'https://images.unsplash.com/photo-1629904853893-c2c8981a1dc5?auto=format&fit=crop&w=1200&q=80', ARRAY['імплантація','підготовка'])
ON CONFLICT (slug) DO NOTHING;
