import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../supabaseClient';

/* ── Parallax hook ─────────────────────────────────────── */
function useParallax(speed = 0.4) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let rafId = null;
    let lastY = window.scrollY;

    const update = () => {
      const scrollY = window.scrollY;
      if (scrollY === lastY) { rafId = null; return; }
      lastY = scrollY;
      const parent = el.closest('[data-parallax-root]') || el.parentElement;
      const rect = parent.getBoundingClientRect();
      const offset = (window.innerHeight / 2 - rect.top - rect.height / 2) * speed;
      el.style.transform = `translateY(${offset}px)`;
      rafId = null;
    };

    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(update);
    };

    // initial position
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [speed]);
  return ref;
}

/* ── Intersection observer hook ────────────────────────── */
function useFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          // also handle inline style opacity for hero
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── Counter animation ─────────────────────────────────── */
function CountUp({ to, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        let start = 0;
        const num = parseInt(to, 10);
        const step = Math.ceil(num / 60);
        const timer = setInterval(() => {
          start = Math.min(start + step, num);
          setVal(start);
          if (start >= num) clearInterval(timer);
        }, 22);
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ── Section dot-nav ───────────────────────────────────── */
const NAV_SECTIONS = [
  { id: 'sec-hero',         label: 'Головна',      dark: true  },
  { id: 'sec-services',     label: 'Послуги',      dark: false },
  { id: 'sec-whyus',        label: 'Чому ми',      dark: true  },
  { id: 'sec-process',      label: 'Процес',       dark: false },
  { id: 'sec-doctors',      label: 'Лікарі',       dark: true  },
  { id: 'sec-gallery',      label: 'Галерея',      dark: false },
  { id: 'sec-reviews',      label: 'Відгуки',      dark: true  },
  { id: 'sec-calculator',   label: 'Калькулятор',  dark: false },
  { id: 'sec-pricing',      label: 'Ціни',         dark: false },
  { id: 'sec-faq',          label: 'Питання',      dark: false },
  { id: 'sec-cta',          label: 'Акція',        dark: true  },
  { id: 'sec-contacts',     label: 'Контакти',     dark: false },
];

function ScrollDotNav() {
  const [active, setActive] = useState('sec-hero');

  const isDark = NAV_SECTIONS.find((s) => s.id === active)?.dark ?? false;

  useEffect(() => {
    const observers = NAV_SECTIONS.map(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o && o.disconnect());
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className={`scroll-dot-nav${isDark ? ' scroll-dot-nav--light' : ''}`} aria-label="Навігація по секціях">
      {NAV_SECTIONS.map(({ id, label }) => (
        <button
          key={id}
          className={`scroll-dot${active === id ? ' scroll-dot--active' : ''}`}
          onClick={() => scrollTo(id)}
          title={label}
          aria-label={label}
        >
          <span className="scroll-dot__tooltip">{label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ─────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      <ScrollDotNav />
      <div id="sec-hero"><HeroSection /></div>
      <StatsBar />
      <div id="sec-services"><ServicesSection /></div>
      <div id="sec-whyus"><WhyUsSection /></div>
      <div id="sec-process"><ProcessSection /></div>
      <div id="sec-doctors"><DoctorsSection /></div>
      <div id="sec-gallery"><GallerySection /></div>
      <div id="sec-reviews"><TestimonialsSection /></div>
      <div id="sec-calculator"><CalculatorSection /></div>
      <div id="sec-pricing"><PricingSection /></div>
      <div id="sec-faq"><FaqSection /></div>
      <div id="sec-cta"><CtaBanner /></div>
      <div id="sec-contacts"><ContactsSection /></div>
    </>
  );
}

/* ── HERO ───────────────────────────────────────────────── */
function HeroSection() {
  const bgRef = useParallax(0.35);
  const copyRef = useFadeIn();

  return (
    <section className="hp-hero" data-parallax-root>
      <div className="hp-hero__bg-wrap">
        <div
          ref={bgRef}
          className="hp-hero__bg"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=1800&q=80)',
          }}
        />
        <div className="hp-hero__overlay" />
      </div>

      <div className="hp-hero__inner" ref={copyRef} style={{ opacity: 0, transition: 'opacity 0.8s 0.1s, transform 0.8s 0.1s', transform: 'translateY(30px)' }}>
        <p className="eyebrow eyebrow--light">Преміальна стоматологія · Київ</p>
        <h1 className="hp-hero__title">
          Посмішка, якою<br />
          <em>хочеться ділитися</em>
        </h1>
        <p className="hp-hero__sub">
          Цифрова діагностика, дбайливі протоколи лікування та команда лікарів,
          яка веде вас від першого візиту до стійкого результату.
        </p>
        <div className="hp-hero__actions">
          <Link className="btn-hero-primary" to="/appointment">Записатись на прийом</Link>
          <Link className="btn-hero-ghost" to="/services">Дивитися послуги</Link>
        </div>
        <div className="hp-hero__chips">
          <span>✓ Без болю та дискомфорту</span>
          <span>✓ 3D-діагностика</span>
          <span>✓ Гарантія на роботи</span>
        </div>
      </div>

      <div className="hp-hero__scroll-hint">
        <span />
      </div>
    </section>
  );
}

/* ── STATS ─────────────────────────────────────────────── */
function StatsBar() {
  return (
    <section className="hp-stats">
      {[
        { num: 3400, suffix: '+', label: 'задоволених пацієнтів' },
        { num: 98, suffix: '%', label: 'повторних рекомендацій' },
        { num: 12, suffix: ' р.', label: 'клінічної практики' },
        { num: 24, suffix: '', label: 'лікаря у команді' },
        { num: 5, suffix: '★', label: 'середній рейтинг' },
      ].map((s) => (
        <div className="hp-stats__item" key={s.label}>
          <strong>
            <CountUp to={s.num} suffix={s.suffix} />
          </strong>
          <span>{s.label}</span>
        </div>
      ))}
    </section>
  );
}

/* ── SERVICES ──────────────────────────────────────────── */
const SERVICES = [
  { icon: '🦷', title: 'Терапія та мікроскопія', text: 'Лікування карієсу, пульпіту та каналів із збільшенням до 25×. Повне збереження зуба.', price: 'від 2 900 ₴', color: '#eef7f1' },
  { icon: '✨', title: 'Естетика посмішки', text: 'Вініри, відбілювання та реставрації з індивідуальним підбором відтінку.', price: 'від 11 500 ₴', color: '#fdf6ec' },
  { icon: '🔩', title: 'Імплантація', text: 'Nobel Biocare та Straumann з цифровим контролем кожного етапу. Гарантія 10 років.', price: 'від 43 000 ₴', color: '#f0f4fd' },
  { icon: '🛡️', title: 'Пародонтологія', text: 'Лікування ясен та контроль запалень для стійкого довгострокового результату.', price: 'від 4 200 ₴', color: '#fdf0f0' },
  { icon: '📐', title: 'Ортодонтія', text: 'Елайнери та брекети з цифровим плануванням руху зубів на кожному етапі.', price: 'від 34 000 ₴', color: '#f5f0fd' },
  { icon: '🌿', title: 'Профілактика', text: 'Гігієна Air Flow та персональний календар профілактики. Раз на 6 місяців.', price: 'від 3 900 ₴', color: '#eef7f1' },
];

function ServicesSection() {
  const ref = useFadeIn();
  return (
    <section className="hp-section fade-block" ref={ref}>
      <div className="hp-section__head">
        <p className="eyebrow">Послуги</p>
        <h2>Повний цикл стоматологічної допомоги</h2>
        <p className="hp-section__sub">
          Від профілактики до складних реабілітацій — всі спеціальності під одним дахом.
        </p>
      </div>
      <div className="hp-services">
        {SERVICES.map((s) => (
          <article className="hp-service-card" key={s.title} style={{ '--card-bg': s.color }}>
            <span className="hp-service-card__icon">{s.icon}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            <footer>
              <span className="price">{s.price}</span>
              <Link to="/services" className="card-link">Детальніше →</Link>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ── WHY US ─────────────────────────────────────────────── */
function WhyUsSection() {
  const bgRef = useParallax(0.2);
  const ref = useFadeIn();

  const items = [
    { icon: '🏆', title: 'Досвід 12 років', text: 'Понад 3400 пацієнтів та складних клінічних випадків за плечима.' },
    { icon: '🔬', title: 'Мікроскопна стоматологія', text: 'Збільшення до 25× для максимально точного і щадного лікування.' },
    { icon: '📲', title: 'Цифровий робочий процес', text: '3D-сканування, CBCT та CAD/CAM виготовлення реставрацій за день.' },
    { icon: '💊', title: 'Комфортна анестезія', text: 'Комп\'ютерне введення препарату: без стресу і болю.' },
    { icon: '🛡️', title: 'Гарантія на роботи', text: 'Офіційна гарантія до 10 років на імплантати і реставрації.' },
    { icon: '🌐', title: 'Особистий кабінет', text: 'Онлайн-картка пацієнта, нагадування та цифрова знижкова система.' },
  ];

  return (
    <section className="hp-whyus" data-parallax-root>
      <div className="hp-whyus__bg-wrap">
        <div
          ref={bgRef}
          className="hp-whyus__bg"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1581595219315-a187dd40c322?auto=format&fit=crop&w=1600&q=80)',
          }}
        />
        <div className="hp-whyus__overlay" />
      </div>
      <div className="hp-whyus__inner fade-block" ref={ref}>
        <div className="hp-section__head hp-section__head--light">
          <p className="eyebrow eyebrow--light">Чому обирають нас</p>
          <h2 style={{ color: '#fff' }}>Стандарти, які<br /><em style={{ color: 'var(--accent-light)' }}>задають рівень</em></h2>
        </div>
        <div className="hp-whyus__grid">
          {items.map((it) => (
            <div className="hp-whyus__card" key={it.title}>
              <span className="hp-whyus__icon">{it.icon}</span>
              <h3>{it.title}</h3>
              <p>{it.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── PROCESS ────────────────────────────────────────────── */
function ProcessSection() {
  const ref = useFadeIn();
  const steps = [
    { n: '01', title: 'Консультація', text: 'Повний огляд порожнини рота, 3D-сканування та обговорення цілей лікування.' },
    { n: '02', title: 'Діагностика та план', text: 'Цифровий план лікування з часовими рамками та фінансовим кошторисом.' },
    { n: '03', title: 'Лікування', text: 'Виконання всіх процедур за планом. Ми коригуємо під ваш графік.' },
    { n: '04', title: 'Підтримуюча терапія', text: 'Регулярні профілактичні візити та онлайн-контроль через особистий кабінет.' },
  ];
  return (
    <section className="hp-section fade-block" ref={ref}>
      <div className="hp-section__head">
        <p className="eyebrow">Як це працює</p>
        <h2>Чотири кроки до здорової посмішки</h2>
      </div>
      <div className="hp-process">
        {steps.map((s, i) => (
          <div className="hp-process__step" key={s.n}>
            <div className="hp-process__num">{s.n}</div>
            {i < steps.length - 1 && <div className="hp-process__line" />}
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── DOCTORS ────────────────────────────────────────────── */
const DOCTORS = [
  {
    name: 'Андрій Кравченко',
    role: 'Головний лікар, імплантолог',
    exp: '12 років досвіду',
    tags: ['Nobel Biocare', 'Straumann', '3D-хірургія'],
    photo: 'https://images.unsplash.com/photo-1612531386530-97286d97c2d2?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Михайло Осипов',
    role: 'Ортопед-гнатолог',
    exp: '10 років досвіду',
    tags: ['CAD/CAM', 'Вініри', 'Повна реабілітація'],
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Катерина Романова',
    role: 'Ортодонт',
    exp: '8 років досвіду',
    tags: ['Invisalign', 'Damon', 'Цифровий план'],
    photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Олег Тищенко',
    role: 'Пародонтолог',
    exp: '9 років досвіду',
    tags: ['Лазер', 'Аугментація', 'PRF-терапія'],
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=700&q=80',
  },
];

function DoctorsSection() {
  const ref = useFadeIn();
  return (
    <section className="hp-section hp-section--dark fade-block" ref={ref}>
      <div className="hp-section__head hp-section__head--light">
        <p className="eyebrow eyebrow--light">Команда</p>
        <h2 style={{ color: '#f6f2e8' }}>Лікарі, які<br />працюють на результат</h2>
      </div>
      <div className="hp-doctors">
        {DOCTORS.map((d) => (
          <article className="hp-doctor" key={d.name}>
            <div className="hp-doctor__photo" style={{ backgroundImage: `url(${d.photo})` }} />
            <div className="hp-doctor__info">
              <h3>{d.name}</h3>
              <p className="hp-doctor__role">{d.role}</p>
              <p className="hp-doctor__exp">{d.exp}</p>
              <div className="hp-doctor__tags">
                {d.tags.map((t) => <span key={t}>{t}</span>)}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ── GALLERY ────────────────────────────────────────────── */
function GallerySection() {
  const ref = useFadeIn();
  const imgs = [
    { url: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=900&q=80', big: true },
    { url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80' },
    { url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=600&q=80' },
    { url: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80' },
    { url: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=900&q=80', wide: true },
  ];
  return (
    <section className="hp-section fade-block" ref={ref}>
      <div className="hp-section__head">
        <p className="eyebrow">Клініка</p>
        <h2>Сучасне обладнання та простір без стресу</h2>
        <p className="hp-section__sub">Наша клініка спроєктована так, щоб кожен візит відчувався як відпочинок.</p>
      </div>
      <div className="hp-gallery">
        {imgs.map((img, i) => (
          <div
            key={i}
            className={`hp-gallery__item${img.big ? ' hp-gallery__item--big' : ''}${img.wide ? ' hp-gallery__item--wide' : ''}`}
            style={{ backgroundImage: `url(${img.url})` }}
          />
        ))}
      </div>
    </section>
  );
}

/* ── TESTIMONIALS ───────────────────────────────────────── */
const REVIEWS = [
  { name: 'Олена Мельник', stars: 5, date: 'Лютий 2026', verified: true, text: 'Нарешті знайшла клініку, де не страшно. Анна Василівна поставила вінір — результат кращий за очікування. Рекомендую всім, хто хоче якість без переплати.' },
  { name: 'Дмитро Савченко', stars: 5, date: 'Березень 2026', verified: true, text: 'Вставив імплантат Nobel. Все пройшло без болю і з повним цифровим контролем. Вже через 3 місяці — постійна коронка. Чіткі строки і ніяких сюрпризів.' },
  { name: 'Тетяна Коваль', stars: 5, date: 'Квітень 2026', verified: true, text: 'Обрала елайнери у Катерини. Завдяки цифровому плануванню бачила результат ще до початку. Дуже приємний персонал і гнучкий графік.' },
  { name: 'Андрій Литвин', stars: 5, date: 'Квітень 2026', verified: true, text: 'Лікував кореневі канали під мікроскопом. Відчуттів майже нуль, а зуб збережено — мій стоматолог у іншій клініці казав, що видаляти треба.' },
];

function StarsRow({ n }) {
  return (
    <div className="stars-row">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < n ? '#f0a800' : '#ddd' }}>★</span>
      ))}
    </div>
  );
}

function TestimonialsSection() {
  const ref = useFadeIn();
  return (
    <section className="hp-section hp-section--dark fade-block" ref={ref}>
      <div className="hp-section__head hp-section__head--light">
        <p className="eyebrow eyebrow--light">Відгуки</p>
        <h2 style={{ color: '#f6f2e8' }}>Що кажуть наші пацієнти</h2>
      </div>
      <div className="hp-reviews">
        {REVIEWS.map((r) => (
          <blockquote className="hp-review" key={r.name}>
            <StarsRow n={r.stars} />
            <p>"{r.text}"</p>
            <footer>
              <strong>{r.name}</strong>
              <span>{r.date} {r.verified ? '· Перевірений візит' : ''}</span>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

/* ── CALCULATORS ──────────────────────────────────────── */
function CalculatorSection() {
  const [calc, setCalc] = useState({ implant: 1, aligner: 1, veneer: 2 });
  const implant = calc.implant * 43000;
  const aligner = calc.aligner * 34000;
  const veneer = calc.veneer * 12000;
  const total = implant + aligner + veneer;

  return (
    <section className="hp-section">
      <div className="hp-section__head">
        <p className="eyebrow">Калькулятор вартості</p>
        <h2>Орієнтовний кошторис онлайн</h2>
        <p className="hp-section__sub">Швидка оцінка для імплантації, елайнерів і вінірів до консультації.</p>
      </div>

      <div className="calc-wrap">
        <label className="calc-row">
          <span>Кількість імплантів</span>
          <input type="range" min="0" max="6" value={calc.implant} onChange={(e) => setCalc({ ...calc, implant: Number(e.target.value) })} />
          <strong>{implant.toLocaleString('uk-UA')} ₴</strong>
        </label>
        <label className="calc-row">
          <span>Сегменти елайнерів</span>
          <input type="range" min="0" max="3" value={calc.aligner} onChange={(e) => setCalc({ ...calc, aligner: Number(e.target.value) })} />
          <strong>{aligner.toLocaleString('uk-UA')} ₴</strong>
        </label>
        <label className="calc-row">
          <span>Кількість вінірів</span>
          <input type="range" min="0" max="10" value={calc.veneer} onChange={(e) => setCalc({ ...calc, veneer: Number(e.target.value) })} />
          <strong>{veneer.toLocaleString('uk-UA')} ₴</strong>
        </label>

        <div className="calc-total">
          <span>Разом орієнтовно:</span>
          <strong>{total.toLocaleString('uk-UA')} ₴</strong>
          <Link to="/appointment" className="btn-solid">Уточнити план з лікарем</Link>
        </div>
      </div>
    </section>
  );
}

/* ── PRICING ────────────────────────────────────────────── */
function PricingSection() {
  const ref = useFadeIn();
  const plans = [
    {
      name: 'Базовий догляд',
      price: '3 900 ₴',
      period: 'за сеанс',
      items: ['Повне чищення зубів', 'Air Flow', 'Полірування', 'Перевірка ясен', 'Рекомендації'],
    },
    {
      name: 'Комплексна програма',
      price: '18 500 ₴',
      period: 'за рік',
      featured: true,
      items: ['4 гігієни Air Flow', 'Консультації без обмежень', 'Знижка 10% на лікування', 'Пріоритетний запис', 'Особистий менеджер', 'Нагадування та контроль'],
    },
    {
      name: 'VIP абонемент',
      price: '38 000 ₴',
      period: 'за рік',
      items: ['Все з Комплексної програми', 'Відбілювання Zoom у подарунок', 'Знижка 20% на лікування', 'Запис у день звернення', 'Домашній набір гігієни'],
    },
  ];
  return (
    <section className="hp-section fade-block" ref={ref}>
      <div className="hp-section__head">
        <p className="eyebrow">Ціни</p>
        <h2>Прозорі програми обслуговування</h2>
        <p className="hp-section__sub">Жодних прихованих платежів. Вартість фіксується перед початком лікування.</p>
      </div>
      <div className="hp-pricing">
        {plans.map((p) => (
          <div className={`hp-plan${p.featured ? ' hp-plan--featured' : ''}`} key={p.name}>
            {p.featured && <div className="hp-plan__badge">Найпопулярніший</div>}
            <h3>{p.name}</h3>
            <div className="hp-plan__price">
              <strong>{p.price}</strong>
              <span>{p.period}</span>
            </div>
            <ul>
              {p.items.map((it) => <li key={it}>{it}</li>)}
            </ul>
            <Link to="/appointment" className={p.featured ? 'btn-solid' : 'btn-ghost'}>
              Обрати план
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── FAQ ────────────────────────────────────────────────── */
const FAQS = [
  { cat: 'Біль', q: 'Чи боляче лікувати зуби?', a: 'Ні. Ми використовуємо комп\'ютерну анестезію STA — введення препарату майже непомітне. Повна безболісність гарантована.' },
  { cat: 'Імплантація', q: 'Скільки часу займає імплантація?', a: 'Від встановлення до постійної коронки — 3–6 місяців. При умовах одномоментного протезування можливо отримати тимчасовий зуб вже в день операції.' },
  { cat: 'Оплата', q: 'Чи є розстрочка або кредит?', a: 'Так. Ми пропонуємо безвідсоткову розстрочку до 24 місяців через ПриватБанк та monobank без переплат.' },
  { cat: 'Перший візит', q: 'Як підготуватися до першого прийому?', a: 'Нічого особливого. Приходьте натщесерце за 2 години якщо планується анестезія. Візьміть попередні знімки якщо є.' },
  { cat: 'Гарантії', q: 'Чи є гарантія на роботи?', a: 'Так. Офіційна гарантія: реставрації — 3 роки, коронки — 5 років, імплантати — 10 років. Умови фіксуються в договорі.' },
  { cat: 'Діти', q: 'Чи приймаєте ви дітей?', a: 'Так, приймаємо дітей з 3 років. У нас є дитячий стоматолог і адаптований протокол для маленьких пацієнтів.' },
];

function FaqSection() {
  const ref = useFadeIn();
  const [open, setOpen] = useState(null);
  const [cat, setCat] = useState('Усі');
  const cats = ['Усі', ...new Set(FAQS.map((item) => item.cat))];
  const shown = cat === 'Усі' ? FAQS : FAQS.filter((item) => item.cat === cat);
  return (
    <section className="hp-section fade-block" ref={ref}>
      <div className="hp-section__head">
        <p className="eyebrow">Питання та відповіді</p>
        <h2>Найчастіші запитання</h2>
      </div>
      <div className="chips-row" style={{ marginBottom: '14px' }}>
        {cats.map((item) => (
          <button key={item} className={`chip${cat === item ? ' chip--active' : ''}`} onClick={() => setCat(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="hp-faq">
        {shown.map((f, i) => (
          <div className={`hp-faq__item${open === i ? ' hp-faq__item--open' : ''}`} key={i}>
            <button className="hp-faq__q" onClick={() => setOpen(open === i ? null : i)}>
              {f.q}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points={open === i ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
              </svg>
            </button>
            {open === i && <p className="hp-faq__a">{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── CTA BANNER ─────────────────────────────────────────── */
function CtaBanner() {
  const bgRef = useParallax(0.25);
  const ref = useFadeIn();
  const [variant, setVariant] = useState('A');

  useEffect(() => {
    const cached = localStorage.getItem('cta-variant');
    const selected = cached || (Math.random() > 0.5 ? 'A' : 'B');
    localStorage.setItem('cta-variant', selected);
    setVariant(selected);
    db.trackAbEvent({ experiment_key: 'main_cta', variant: selected, event_name: 'impression' });
  }, []);

  const ctaLabel = variant === 'A'
    ? 'Записатись на безкоштовну консультацію →'
    : 'Отримати персональний план лікування →';

  return (
    <section className="hp-cta" data-parallax-root>
      <div className="hp-cta__bg-wrap">
        <div
          ref={bgRef}
          className="hp-cta__bg"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=1600&q=80)',
          }}
        />
        <div className="hp-cta__overlay" />
      </div>
      <div className="hp-cta__inner fade-block" ref={ref}>
        <p className="eyebrow eyebrow--light">Почніть сьогодні</p>
        <h2 style={{ color: '#fff', fontSize: 'clamp(2rem, 5vw, 3.6rem)' }}>
          Перша консультація — безкоштовно
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: '520px', margin: '16px auto 32px' }}>
          Запишіться зараз і отримайте безкоштовний огляд та цифрову фотографію посмішки для порівняння.
        </p>
        <Link
          to="/appointment"
          className="btn-cta-accent"
          onClick={() => db.trackAbEvent({ experiment_key: 'main_cta', variant, event_name: 'click' })}
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}

/* ── CONTACTS ───────────────────────────────────────────── */
function ContactsSection() {
  const ref = useFadeIn();
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [consult, setConsult] = useState({ name: '', phone: '', preferred_time: '', message: '' });

  const submitConsult = async (e) => {
    e.preventDefault();
    setSending(true);
    const { error } = await db.createConsultRequest(consult);
    setSending(false);
    if (!error) {
      setDone(true);
      setConsult({ name: '', phone: '', preferred_time: '', message: '' });
    }
  };

  return (
    <section className="hp-section fade-block" ref={ref}>
      <div className="hp-section__head">
        <p className="eyebrow">Контакти</p>
        <h2>Де нас знайти</h2>
      </div>
      <div className="hp-contacts">
        <div className="hp-contacts__info">
          <div className="hp-contacts__block">
            <strong>Адреса</strong>
            <p>вул. Хрещатик, 25<br />м. Київ, 01001</p>
            <span className="hp-contacts__hint">2 хв. від ст. м. Хрещатик</span>
          </div>
          <div className="hp-contacts__block">
            <strong>Графік роботи</strong>
            <p>Понеділок – П'ятниця: 9:00 – 21:00</p>
            <p>Субота – Неділя: 10:00 – 18:00</p>
          </div>
          <div className="hp-contacts__block">
            <strong>Телефон</strong>
            <a href="tel:+380951234567">+380 (95) 123-45-67</a>
            <a href="tel:+380441234567">+380 (44) 123-45-67</a>
          </div>
          <div className="hp-contacts__block">
            <strong>Email</strong>
            <a href="mailto:info@dentalux.ua">info@dentalux.ua</a>
          </div>
          <Link to="/appointment" className="btn-solid" style={{ marginTop: '8px', display: 'inline-block', width: 'fit-content' }}>
            Записатись онлайн
          </Link>
        </div>
        <div className="hp-contacts__map">
          <iframe
            title="Карта"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2540.5!2d30.5224!3d50.4501!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTDCsDI3JzAwLjQiTiAzMMKwMzEnMjAuNiJF!5e0!3m2!1suk!2sua!4v1000000000000"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      <div className="cab-card" style={{ marginTop: '18px' }}>
        <h3>Онлайн-консультант і callback</h3>
        <p>Залиште номер, і адміністратор зв'яжеться з вами у зручний час.</p>
        <form className="appt-fields" onSubmit={submitConsult}>
          <div className="field">
            <label className="field__label">Ім'я</label>
            <input className="field__input" value={consult.name} onChange={(e) => setConsult({ ...consult, name: e.target.value })} required />
          </div>
          <div className="field">
            <label className="field__label">Телефон</label>
            <input className="field__input" value={consult.phone} onChange={(e) => setConsult({ ...consult, phone: e.target.value })} required />
          </div>
          <div className="field">
            <label className="field__label">Зручний час</label>
            <input className="field__input" value={consult.preferred_time} onChange={(e) => setConsult({ ...consult, preferred_time: e.target.value })} placeholder="Наприклад, 13:00-15:00" />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label className="field__label">Питання</label>
            <textarea className="field__input" rows="3" value={consult.message} onChange={(e) => setConsult({ ...consult, message: e.target.value })} />
          </div>
          <button className="btn-solid" type="submit" disabled={sending}>{sending ? 'Відправка...' : 'Замовити дзвінок'}</button>
          {done && <p style={{ margin: 0 }}>Дякуємо! Ми зв'яжемося з вами найближчим часом.</p>}
        </form>
      </div>
    </section>
  );
}
