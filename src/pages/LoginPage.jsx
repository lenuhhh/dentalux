import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Введіть коректний email у форматі name@example.com');
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await login(email.trim(), password);
      if (err) setError(err.message || 'Невірний email або пароль');
      else navigate('/cabinet');
    } catch (ex) {
      setError('Помилка входу. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-brand__inner">
          <svg className="auth-brand__icon" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="14" fill="#183728"/>
            <path d="M24 9C18 9 13 14.5 13 20c0 2.6.7 4.8 1.8 6.5 1.1 1.8 2.4 4.7 3 8.9.2 1.2 1 1.8 1.8 1.8s1.6-.6 1.8-1.8c.4-1.8.9-3.6 1.4-3.6s1 1.8 1.4 3.6c.2 1.2.9 1.8 1.8 1.8.8 0 1.6-.6 1.8-1.8.6-4.2 1.9-7.1 3-8.9C36.3 24.8 37 22.6 37 20 37 14.5 30 9 24 9z" fill="#b68f4b"/>
            <path d="M19 18.5c.6-1.2 2.4-3 5-3s4.4 1.8 5 3" stroke="#fffdf8" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <h1 className="auth-brand__name">ДентаЛюкс</h1>
          <p className="auth-brand__tagline">Преміальна стоматологія у серці Києва</p>
          <ul className="auth-brand__perks">
            <li>✓ Більше 3400 задоволених пацієнтів</li>
            <li>✓ Цифрова карта лікування</li>
            <li>✓ Онлайн-запис 24/7</li>
          </ul>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <p className="auth-card__eyebrow">Вхід</p>
          <h2 className="auth-card__title">З поверненням</h2>
          <p className="auth-card__sub">Увійдіть, щоб переглянути записи та історію лікування</p>

          {error && <div className="auth-error"><span>⚠</span> {error}</div>}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="field">
              <label className="field__label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                className="field__input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trimStart())}
                placeholder="your@email.com"
                autoComplete="email"
                required
              />
              <span className="field__hint">Наприклад: name@example.com</span>
            </div>

            <div className="field">
              <div className="field__label-row">
                <label className="field__label" htmlFor="login-pass">Пароль</label>
              </div>
              <div className="field__pass-wrap">
                <input
                  id="login-pass"
                  className="field__input"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button type="button" className="field__eye" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? <span className="auth-btn__spinner" /> : 'Увійти'}
            </button>
          </form>

          <p className="auth-card__footer">
            Немає облікового запису?{' '}
            <Link to="/register" className="auth-card__link">Зареєструватися</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
