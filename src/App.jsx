import { HashRouter as Router, Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import CabinetPage from './pages/CabinetPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AppointmentPage from './pages/AppointmentPage';
import CasesPage from './pages/CasesPage';
import SymptomsPage from './pages/SymptomsPage';
import BlogPage from './pages/BlogPage';

export default function App() {
  const { user } = useAuth();

  return (
    <Router>
      <ScrollToTop />
      <Header user={user} />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/appointment" element={<AppointmentPage />} />
          <Route path="/cabinet" element={<CabinetPage />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/symptoms" element={<SymptomsPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

function Header({ user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    await logout();
    closeMenu();
  };

  const navLinkClass = ({ isActive }) =>
    isActive ? 'nav-link nav-link--active' : 'nav-link';

  return (
    <header className={`site-header${scrolled ? ' site-header--scrolled' : ''}`}>
      {/* Top bar */}
      <div className="header-topbar">
        <div className="topbar-inner">
          <a href="tel:+380951234567" className="topbar-phone">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 9.81 19.79 19.79 0 01.07 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
            </svg>
            +380 (95) 123-45-67
          </a>
          <div className="topbar-info">
            <span>Пн–Пт 9:00–21:00</span>
            <span className="topbar-sep">·</span>
            <span>Сб–Нд 10:00–18:00</span>
            <span className="topbar-sep">·</span>
            <span>вул. Хрещатик, 25, Київ</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="header-main">
        <Link to="/" className="brand" onClick={closeMenu}>
          <svg className="brand-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="#183728"/>
            <path d="M20 8C15 8 11 12.5 11 17c0 2.2.6 4 1.5 5.5.9 1.5 2 4 2.5 7.5.2 1 .8 1.5 1.5 1.5.8 0 1.3-.5 1.5-1.5.3-1.5.7-3 1-3s.7 1.5 1 3c.2 1 .7 1.5 1.5 1.5.7 0 1.3-.5 1.5-1.5.5-3.5 1.6-6 2.5-7.5.9-1.5 1.5-3.3 1.5-5.5C29 12.5 25 8 20 8z" fill="#b68f4b"/>
            <path d="M16 15.5c.5-1 2-2.5 4-2.5s3.5 1.5 4 2.5" stroke="#fffdf8" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <div className="brand-text">
            <span className="brand-name">ДентаЛюкс</span>
            <span className="brand-sub">Преміальна стоматологія</span>
          </div>
        </Link>

        <nav className={`main-nav${menuOpen ? ' main-nav--open' : ''}`}>
          <NavLink to="/" className={navLinkClass} onClick={closeMenu} end>
            Головна
          </NavLink>
          <NavLink to="/services" className={navLinkClass} onClick={closeMenu}>
            Послуги
          </NavLink>
          <NavLink to="/appointment" className={navLinkClass} onClick={closeMenu}>
            Запис
          </NavLink>
          <NavLink to="/cases" className={navLinkClass} onClick={closeMenu}>
            Кейси
          </NavLink>
          <NavLink to="/symptoms" className={navLinkClass} onClick={closeMenu}>
            Симптоми
          </NavLink>
          <NavLink to="/blog" className={navLinkClass} onClick={closeMenu}>
            Блог
          </NavLink>

          <div className="nav-divider" />

          {user ? (
            <>
              <NavLink to="/cabinet" className={({ isActive }) => `nav-link nav-link--user${isActive ? ' nav-link--active' : ''}`} onClick={closeMenu}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Кабінет
              </NavLink>
              <button className="nav-link nav-link--logout" onClick={handleLogout}>
                Вийти
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass} onClick={closeMenu}>
                Вхід
              </NavLink>
              <NavLink to="/register" className="nav-cta" onClick={closeMenu}>
                Записатись
              </NavLink>
            </>
          )}
        </nav>

        <button
          className={`burger${menuOpen ? ' burger--open' : ''}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Меню"
        >
          <span /><span /><span />
        </button>
      </div>

      {menuOpen && <div className="nav-overlay" onClick={closeMenu} />}
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">ДентаЛюкс</span>
          <p>Преміальна стоматологія у Києві. Сучасні технології та досвідчені лікарі.</p>
        </div>
        <div className="footer-links">
          <div>
            <strong>Навігація</strong>
            <Link to="/">Головна</Link>
            <Link to="/services">Послуги</Link>
            <Link to="/appointment">Запис на прийом</Link>
            <Link to="/cases">Кейси</Link>
            <Link to="/symptoms">Симптоми</Link>
            <Link to="/blog">Блог</Link>
            <Link to="/cabinet">Особистий кабінет</Link>
          </div>
          <div>
            <strong>Контакти</strong>
            <a href="tel:+380951234567">+380 (95) 123-45-67</a>
            <span>вул. Хрещатик, 25, Київ</span>
            <span>Пн–Пт 9:00–21:00</span>
            <span>Сб–Нд 10:00–18:00</span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} ДентаЛюкс. Всі права захищені.</p>
        <p>Ліцензія №ЛО-77-01-019423 від 15.03.2022</p>
      </div>
    </footer>
  );
}
