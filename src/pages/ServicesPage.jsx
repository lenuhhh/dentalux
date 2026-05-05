import { useState } from 'react';
import { Link } from 'react-router-dom';

const servicesData = [
  {
    id: 1,
    category: 'Терапія',
    title: 'Лікування карієсу',
    description: 'Сучасне лікування карієсу з використанням композитних матеріалів.',
    price: '2 900 ₴',
    duration: '40 хвилин',
    image:
      'https://images.unsplash.com/photo-1588776814546-ec7e57f9f3f9?auto=format&fit=crop&w=800&q=80',
    details:
      'Лікування сповільнюється на 100% без фреза, використання мікроскопу для максимальної точності та збереження власних тканин зуба.',
  },
  {
    id: 2,
    category: 'Терапія',
    title: 'Лікування каналів',
    description: 'Ендодонтія під мікроскопом з гарантією.',
    price: '4 500 ₴',
    duration: '90 хвилин',
    image:
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
    details:
      'Повне очищення та герметизація кореневих каналів сучасним методом гута-перча. Результат - збереження зуба на роки.',
  },
  {
    id: 3,
    category: 'Естетика',
    title: 'Професійне відбілювання',
    description: 'Яскрава посмішка за одну процедуру.',
    price: '3 500 ₴',
    duration: '60 хвилин',
    image:
      'https://images.unsplash.com/photo-1606265752439-1f18756aa5fc?auto=format&fit=crop&w=800&q=80',
    details:
      'Відбілювання лазером або LED-світлом дає результат до 8 тонів без шкоди емалі. Ефект триває до 1.5 років.',
  },
  {
    id: 4,
    category: 'Естетика',
    title: 'Вініри',
    description: 'Мікро-вініри з натуральним виглядом.',
    price: '12 000 ₴',
    duration: '2 сеанси',
    image:
      'https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?auto=format&fit=crop&w=800&q=80',
    details:
      'Тонкі керамічні накладки трансформують форму та колір передніх зубів. Максимально естетично і міцно.',
  },
  {
    id: 5,
    category: 'Імплантація',
    title: 'Імплант з коронкою',
    description: 'Повна заміна втраченого зуба.',
    price: '45 000 ₴',
    duration: '5-6 місяців',
    image:
      'https://images.unsplash.com/photo-1629904853893-c2c8981a1dc5?auto=format&fit=crop&w=800&q=80',
    details:
      'Імплант Nobel Biocare або Straumann з коронкою з циркону. Гарантія на роботу до 5 років.',
  },
  {
    id: 6,
    category: 'Ортодонтія',
    title: 'Елайнери Invisalign',
    description: 'Невидимі брекети за комфортною ціною.',
    price: '34 000 ₴',
    duration: '8-12 місяців',
    image:
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    details:
      'Система прозорих капп для випрямлення зубів без видимих брекетів. Можна зняти в будь-який момент.',
    stages: ['Діагностика та фото-протокол', '3D-план руху зубів', 'Видача набору кап', 'Контрольні візити кожні 6-8 тижнів'],
  },
];

const CARE_GUARANTEES = [
  'Гарантія на імплантацію до 10 років',
  'Фіксована вартість етапу до старту лікування',
  'Прозорий план з термінами і прогнозом результату',
  'Безкоштовна корекція плану в межах гарантійного періоду',
];

const DOCTOR_VIDEO = [
  {
    name: 'Анна Кравцова',
    role: 'Імплантолог',
    video: 'https://www.youtube.com/embed/8w2xwR-MrXk',
  },
  {
    name: 'Катерина Романова',
    role: 'Ортодонт',
    video: 'https://www.youtube.com/embed/IUN664s7N-c',
  },
];

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Терапія', 'Естетика', 'Імплантація', 'Ортодонтія'];
  const filtered =
    selectedCategory === 'All' ? servicesData : servicesData.filter((s) => s.category === selectedCategory);

  return (
    <div>
      <section className="section">
        <div className="section-head">
          <p className="eyebrow">Послуги</p>
          <h2>Повний спектр стоматологічної допомоги</h2>
        </div>

        <div className="filter-buttons">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-btn${selectedCategory === cat ? ' active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="services-list">
          {filtered.map((service) => (
            <article className="service-detail-card" key={service.id}>
              <div
                className="service-detail-image"
                style={{ backgroundImage: `url(${service.image})` }}
              />
              <div className="service-detail-content">
                <span className="service-category">{service.category}</span>
                <h3>{service.title}</h3>
                <p className="service-description">{service.description}</p>
                <p className="service-details">{service.details}</p>
                {service.stages && (
                  <ul className="service-stages">
                    {service.stages.map((stage) => (
                      <li key={stage}>{stage}</li>
                    ))}
                  </ul>
                )}
                <div className="service-meta">
                  <span>
                    <strong>Тривалість:</strong> {service.duration}
                  </span>
                  <span>
                    <strong>Ціна:</strong> {service.price}
                  </span>
                </div>
                <Link to={`/appointment?service=${encodeURIComponent(service.title)}`} className="btn-solid">
                  Записатися
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="cab-grid" style={{ marginTop: '20px' }}>
          <article className="cab-card">
            <h3>Гарантії та прозорість лікування</h3>
            <ul className="service-stages">
              {CARE_GUARANTEES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="cab-card">
            <h3>Етапи лікування (єдиний стандарт)</h3>
            <ol className="service-stages">
              <li>Діагностика і фотофіксація</li>
              <li>План з варіантами рішень</li>
              <li>Погодження бюджету і графіку</li>
              <li>Лікування по етапах з контролем якості</li>
              <li>Підтримка і профілактика</li>
            </ol>
          </article>
        </div>

        <div className="cab-grid" style={{ marginTop: '20px' }}>
          {DOCTOR_VIDEO.map((doc) => (
            <article className="cab-card" key={doc.name}>
              <h3>{doc.name}</h3>
              <p>{doc.role}</p>
              <div className="video-wrap">
                <iframe
                  src={doc.video}
                  title={`Відео лікаря ${doc.name}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
