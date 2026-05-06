import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../useAuth';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Паролі не збігаються');
      return;
    }
    if (password.length < 6) {
      setError('Пароль мінімум 6 символів');
      return;
    }

    setLoading(true);
    try {
      const { error: err, session } = await signUp(email, password, { full_name: name, phone });
      if (err) {
        setError(err.message || 'Помилка реєстрації');
      } else if (session) {
        // Email confirmation disabled — user is already logged in
        navigate('/cabinet');
      } else {
        // Email confirmation required — show success screen then go to login
        setSuccess(true);
        setTimeout(() => navigate('/login'), 4000);
      }
    } catch {
      setError('Помилка реєстрації. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-brand">
          <div className="auth-brand__inner">
            <svg className="auth-brand__icon" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="14" fill="#183728" />
              <path d="M24 9C18 9 13 14.5 13 20c0 2.6.7 4.8 1.8 6.5 1.1 1.8 2.4 4.7 3 8.9.2 1.2 1 1.8 1.8 1.8s1.6-.6 1.8-1.8c.4-1.8.9-3.6 1.4-3.6s1 1.8 1.4 3.6c.2 1.2.9 1.8 1.8 1.8.8 0 1.6-.6 1.8-1.8.6-4.2 1.9-7.1 3-8.9C36.3 24.8 37 22.6 37 20 37 14.5 30 9 24 9z" fill="#b68f4b" />
              <path d="M19 18.5c.6-1.2 2.4-3 5-3s4.4 1.8 5 3" stroke="#fffdf8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <h1 className="auth-brand__name">ДентаЛюкс</h1>
          </div>
        </div>
        <div className="auth-form-side">
          <div className="auth-card auth-card--success">
            <div className="auth-success-icon">✓</div>
            <h2 className="auth-card__title">Реєстрацію завершено</h2>
            <p className="auth-card__sub">Перевірте пошту для підтвердження акаунту. Зараз перенаправимо на сторінку входу.</p>
            <Link to="/login" className="auth-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Увійти
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-brand__inner">
          <svg className="auth-brand__icon" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="14" fill="#183728" />
            <path d="M24 9C18 9 13 14.5 13 20c0 2.6.7 4.8 1.8 6.5 1.1 1.8 2.4 4.7 3 8.9.2 1.2 1 1.8 1.8 1.8s1.6-.6 1.8-1.8c.4-1.8.9-3.6 1.4-3.6s1 1.8 1.4 3.6c.2 1.2.9 1.8 1.8 1.8.8 0 1.6-.6 1.8-1.8.6-4.2 1.9-7.1 3-8.9C36.3 24.8 37 22.6 37 20 37 14.5 30 9 24 9z" fill="#b68f4b" />
            <path d="M19 18.5c.6-1.2 2.4-3 5-3s4.4 1.8 5 3" stroke="#fffdf8" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <h1 className="auth-brand__name">ДентаЛюкс</h1>
          <p className="auth-brand__tagline">Преміальна стоматологія у серці Києва</p>
          <ul className="auth-brand__perks">
            <li>✓ Перший огляд безкоштовно</li>
            <li>✓ Онлайн-запис на будь-який час</li>
            <li>✓ Історія лікування в особистому кабінеті</li>
          </ul>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <p className="auth-card__eyebrow">Реєстрація</p>
          <h2 className="auth-card__title">Створіть акаунт</h2>
          <p className="auth-card__sub">Доступ до особистого кабінету та запису онлайн</p>

          {error && <div className="auth-error"><span>⚠</span> {error}</div>}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="field">
              <label className="field__label" htmlFor="reg-name">Ім&apos;я та прізвище</label>
              <input
                id="reg-name"
                className="field__input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Іваненко Іван"
                required
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="reg-phone">Телефон</label>
              <input
                id="reg-phone"
                className="field__input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+38 (0__) ___-__-__"
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                className="field__input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="fields-row">
              <div className="field">
                <label className="field__label" htmlFor="reg-pass">Пароль</label>
                <div className="field__pass-wrap">
                  <input
                    id="reg-pass"
                    className="field__input"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    autoComplete="new-password"
                    required
                  />
                  <button type="button" className="field__eye" onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="reg-confirm">Повторити</label>
                <input
                  id="reg-confirm"
                  className="field__input"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? <span className="auth-btn__spinner" /> : 'Зареєструватися'}
            </button>
          </form>

          <p className="auth-card__footer">
            Вже є акаунт? <Link to="/login" className="auth-card__link">Увійти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
