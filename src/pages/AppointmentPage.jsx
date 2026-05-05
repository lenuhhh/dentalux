import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../useAuth';
import { db } from '../supabaseClient';

const SERVICES = [
  'Консультація',
  'Лікування карієсу',
  'Лікування каналів',
  'Професійна гігієна',
  'Відбілювання',
  'Вініри',
  'Імплантація',
  'Ортодонтія',
  'Протезування',
  'Хірургія',
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '14:00', '14:30', '15:00',
  '15:30', '16:00', '16:30', '17:00', '17:30', '18:00',
  '18:30', '19:00', '19:30', '20:00', '20:30',
];

export default function AppointmentPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [emergency, setEmergency] = useState(false);
  const [form, setForm] = useState({
    service: '',
    date: '',
    time: '',
    doctor_name: '',
    slot_id: null,
    name: user?.user_metadata?.full_name || '',
    phone: user?.user_metadata?.phone || '',
    email: user?.email || '',
    comment: '',
  });
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const serviceParam = params.get('service');
    if (serviceParam) {
      set('service', serviceParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (step !== 2 || !form.date || !form.service) return;
    let mounted = true;

    const loadSlots = async () => {
      setSlotsLoading(true);
      const data = await db.getAvailableSlots({
        date: form.date,
        serviceName: form.service,
        emergency,
      });
      if (mounted) {
        setSlots(data);
        setSlotsLoading(false);
      }
    };

    loadSlots();
    return () => {
      mounted = false;
    };
  }, [step, form.date, form.service, emergency]);

  const handleSubmit = async () => {
    setError('');
    if (!user) {
      setError('Щоб відправити запис, увійдіть або зареєструйтеся.');
      return;
    }
    setLoading(true);
    try {
      const { error: dbErr } = await db.createAppointment({
        user_id: user.id,
        patient_name: form.name,
        patient_phone: form.phone,
        patient_email: form.email,
        service_name: form.service,
        appointment_date: form.date,
        appointment_time: form.time,
        doctor_name: form.doctor_name || null,
        slot_id: form.slot_id,
        is_emergency: emergency,
        notes: form.comment,
        status: 'confirmed',
      });
      if (dbErr) {
        throw new Error(dbErr);
      }
      setStep(4);
    } catch (e) {
      setError(e.message || 'Помилка. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWaitlist = async () => {
    setError('');
    if (!user) {
      setError('Щоб додатися до листа очікування, увійдіть у кабінет.');
      return;
    }
    setWaitlistLoading(true);
    const { error: err } = await db.joinWaitlist({
      user_id: user.id,
      service_name: form.service,
      preferred_date: form.date,
      preferred_time_range: emergency ? 'asap' : '09:00-21:00',
      note: form.comment || (emergency ? 'Екстрений прийом' : null),
      status: 'active',
    });
    setWaitlistLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setError('Вас додано до листа очікування. Ми повідомимо, коли з’явиться вільний слот.');
  };

  const pickSlot = (slot) => {
    set('time', slot.slot_time);
    set('doctor_name', slot.doctor_name || 'Черговий лікар');
    set('slot_id', slot.id);
  };

  const pickManualTime = (time) => {
    set('time', time);
    set('doctor_name', 'Черговий лікар');
    set('slot_id', null);
  };

  if (step === 4) {
    return (
      <div className="appt-page">
        <div className="appt-done">
          <div className="appt-done__icon">✓</div>
          <h2>Запис прийнято</h2>
          <p>Послуга: <strong>{form.service}</strong></p>
          <p>Дата: <strong>{form.date}</strong> о {form.time}</p>
          <p className="appt-done__note">Адміністратор зателефонує протягом 15 хвилин для підтвердження.</p>
          <div className="appt-done__actions">
            <Link to="/" className="appt-btn appt-btn--ghost">На головну</Link>
            {user && <Link to="/cabinet" className="appt-btn appt-btn--solid">Мої записи</Link>}
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { n: 1, label: 'Послуга' },
    { n: 2, label: 'Дата і час' },
    { n: 3, label: 'Контакти' },
  ];

  return (
    <div className="appt-page">
      <div className="appt-layout">
        <aside className="appt-aside">
          <p className="eyebrow">Запис онлайн</p>
          <h1 className="appt-aside__title">Запишіться<br />на прийом</h1>
          <p className="appt-aside__desc">Заповніть форму - адміністратор підтвердить час протягом 15 хвилин.</p>
          <ul className="appt-aside__steps">
            {steps.map((s) => (
              <li key={s.n} className={`appt-step-indicator${step === s.n ? ' active' : step > s.n ? ' done' : ''}`}>
                <span className="appt-step-indicator__num">{step > s.n ? '✓' : s.n}</span>
                {s.label}
              </li>
            ))}
          </ul>
          <div className="appt-aside__contact">
            <strong>Або телефонуйте:</strong>
            <a href="tel:+380951234567">+380 (95) 123-45-67</a>
            <span>Пн-Пт 9:00-21:00 · Сб-Нд 10:00-18:00</span>
          </div>
        </aside>

        <div className="appt-form-wrap">
          {error && <div className="appt-error">{error}</div>}

          {step === 1 && (
            <div className="appt-step">
              <h2 className="appt-step__title">Оберіть послугу</h2>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="appt-btn appt-btn--ghost"
                  onClick={() => {
                    setEmergency(true);
                    set('service', 'Екстрений прийом');
                    set('date', today);
                    setStep(2);
                  }}
                >
                  Екстрений прийом сьогодні
                </button>
                {emergency && <span className="appt-summary-chip">Режим: екстрений</span>}
              </div>
              <div className="appt-services-grid">
                {SERVICES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`appt-service-btn${form.service === s ? ' selected' : ''}`}
                    onClick={() => set('service', s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="appt-step__nav">
                <button className="appt-btn appt-btn--solid" disabled={!form.service} onClick={() => { setEmergency(false); setStep(2); }}>
                  Далі
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="appt-step">
              <h2 className="appt-step__title">Оберіть дату та час</h2>
              <div className="field">
                <label className="field__label" htmlFor="apt-date">Дата</label>
                <input
                  id="apt-date"
                  className="field__input field__input--date"
                  type="date"
                  value={form.date}
                  min={today}
                  onChange={(e) => {
                    set('date', e.target.value);
                    set('time', '');
                  }}
                />
              </div>
              {form.date && (
                <>
                  <p className="appt-time-label">Доступні слоти лікарів</p>
                  {slotsLoading ? (
                    <div className="cab-loader" style={{ minHeight: '80px' }}>Завантаження слотів...</div>
                  ) : slots.length > 0 ? (
                    <div className="appt-time-grid">
                      {slots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          className={`appt-time-btn${form.slot_id === slot.id ? ' selected' : ''}`}
                          onClick={() => pickSlot(slot)}
                          title={slot.doctor_name || 'Лікар'}
                        >
                          {slot.slot_time} · {(slot.doctor_name || 'Лікар').split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="cab-empty" style={{ padding: '20px' }}>
                      <p>На цю дату немає автослотів. Оберіть час вручну або додайтеся у лист очікування.</p>
                      <div className="appt-time-grid" style={{ margin: '10px 0 14px' }}>
                        {TIME_SLOTS.map((t) => (
                          <button
                            key={t}
                            type="button"
                            className={`appt-time-btn${form.time === t ? ' selected' : ''}`}
                            onClick={() => pickManualTime(t)}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <button className="appt-btn appt-btn--ghost" onClick={handleJoinWaitlist} disabled={waitlistLoading}>
                        {waitlistLoading ? 'Додаємо...' : 'Додати у лист очікування'}
                      </button>
                    </div>
                  )}
                </>
              )}
              <div className="appt-step__nav">
                <button className="appt-btn appt-btn--ghost" onClick={() => setStep(1)}>Назад</button>
                <button className="appt-btn appt-btn--solid" disabled={!form.date || !form.time} onClick={() => setStep(3)}>
                  Далі
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="appt-step">
              <h2 className="appt-step__title">Ваші контакти</h2>
              <div className="appt-summary-chip">
                <span>{form.service}</span>
                <span>·</span>
                <span>{form.date}</span>
                <span>·</span>
                <span>{form.time}</span>
                {form.doctor_name ? (
                  <>
                    <span>·</span>
                    <span>{form.doctor_name}</span>
                  </>
                ) : null}
              </div>
              <div className="appt-fields">
                <div className="field">
                  <label className="field__label" htmlFor="apt-name">ПІБ *</label>
                  <input
                    id="apt-name"
                    className="field__input"
                    type="text"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Іваненко Іван"
                    required
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="apt-phone">Телефон *</label>
                  <input
                    id="apt-phone"
                    className="field__input"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="+38 (0__) ___-__-__"
                    required
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="apt-email">Email</label>
                  <input
                    id="apt-email"
                    className="field__input"
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="field field--full">
                  <label className="field__label" htmlFor="apt-comment">Коментар</label>
                  <textarea
                    id="apt-comment"
                    className="field__input field__textarea"
                    rows={3}
                    value={form.comment}
                    onChange={(e) => set('comment', e.target.value)}
                    placeholder="Опишіть скаргу або побажання..."
                  />
                </div>
              </div>
              {!user && (
                <p className="appt-login-hint">
                  <Link to="/login">Увійдіть</Link>, щоб запис зберігся в особистому кабінеті
                </p>
              )}
              <div className="appt-step__nav">
                <button className="appt-btn appt-btn--ghost" onClick={() => setStep(2)}>Назад</button>
                <button
                  className="appt-btn appt-btn--solid"
                  disabled={!user || !form.name || !form.phone || loading}
                  onClick={handleSubmit}
                >
                  {loading ? <span className="auth-btn__spinner" /> : user ? 'Відправити запис' : 'Увійдіть для запису'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
