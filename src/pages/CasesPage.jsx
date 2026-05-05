import { useEffect, useMemo, useState } from 'react';
import { db } from '../supabaseClient';

const FALLBACK_CASES = [
  {
    id: 1,
    title: 'Естетична реставрація фронтальних зубів',
    problem: 'Скол і потемніння',
    description: 'Відновили форму, колір та симетрію усмішки за 2 візити.',
    duration: '14 днів',
    doctor_name: 'Михайло Осипов',
    before_image_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=900&q=80',
    after_image_url: 'https://images.unsplash.com/photo-1606265752439-1f18756aa5fc?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    title: 'Імплантація з цирконієвою коронкою',
    problem: 'Відсутній зуб',
    description: 'Повернули функцію жування і природну естетику.',
    duration: '4 місяці',
    doctor_name: 'Анна Кравцова',
    before_image_url: 'https://images.unsplash.com/photo-1588776814546-ec7e57f9f3f9?auto=format&fit=crop&w=900&q=80',
    after_image_url: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=900&q=80',
  },
];

export default function CasesPage() {
  const [cases, setCases] = useState([]);
  const [problem, setProblem] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await db.getCases(problem === 'all' ? {} : { problem });
      if (mounted) {
        setCases(data.length ? data : FALLBACK_CASES);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [problem]);

  const problems = useMemo(() => ['all', ...new Set((cases.length ? cases : FALLBACK_CASES).map((c) => c.problem))], [cases]);

  return (
    <div className="section section--soft">
      <div className="section__heading">
        <h1>Клінічні кейси До/Після</h1>
        <p>Реальні роботи лікарів ДентаЛюкс з акцентом на прогнозований результат.</p>
      </div>

      <div className="chips-row" style={{ marginBottom: '20px' }}>
        {problems.map((p) => (
          <button
            key={p}
            className={`chip${problem === p ? ' chip--active' : ''}`}
            onClick={() => setProblem(p)}
          >
            {p === 'all' ? 'Усі кейси' : p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="cab-loader">Завантаження кейсів...</div>
      ) : (
        <div className="cases-grid">
          {cases.map((item) => (
            <article className="case-card" key={item.id}>
              <div className="case-card__images">
                <img src={item.before_image_url} alt={`До: ${item.title}`} loading="lazy" />
                <img src={item.after_image_url} alt={`Після: ${item.title}`} loading="lazy" />
              </div>
              <div className="case-card__body">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <p><strong>Проблема:</strong> {item.problem}</p>
                <p><strong>Тривалість:</strong> {item.duration || '-'}</p>
                <p><strong>Лікар:</strong> {item.doctor_name || '-'}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
