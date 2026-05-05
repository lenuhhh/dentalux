import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../supabaseClient';

const FALLBACK = [
  {
    id: 1,
    symptom: 'Болить зуб при жуванні',
    urgency: 'high',
    what_to_do: 'Не грійте щоку. Прийміть знеболювальне за інструкцією і запишіться сьогодні.',
    service_name: 'Лікування каналів',
  },
  {
    id: 2,
    symptom: 'Кровоточать ясна',
    urgency: 'normal',
    what_to_do: 'Запишіться на професійну гігієну та консультацію пародонтолога.',
    service_name: 'Професійна гігієна',
  },
  {
    id: 3,
    symptom: 'Скол зуба',
    urgency: 'high',
    what_to_do: 'Уникайте твердої їжі та холодного, запишіться на консультацію найближчим часом.',
    service_name: 'Консультація',
  },
];

export default function SymptomsPage() {
  const [items, setItems] = useState([]);
  const [urgency, setUrgency] = useState('all');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await db.getSymptoms();
      if (mounted) setItems(data.length ? data : FALLBACK);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (urgency === 'all') return items;
    return items.filter((i) => i.urgency === urgency);
  }, [items, urgency]);

  return (
    <div className="section section--soft">
      <div className="section__heading">
        <h1>Симптоми: що робити зараз</h1>
        <p>Короткі гіди для типових симптомів та швидкий перехід до запису.</p>
      </div>

      <div className="chips-row" style={{ marginBottom: '20px' }}>
        {[
          { id: 'all', label: 'Усі' },
          { id: 'high', label: 'Терміново' },
          { id: 'normal', label: 'Планово' },
        ].map((u) => (
          <button key={u.id} className={`chip${urgency === u.id ? ' chip--active' : ''}`} onClick={() => setUrgency(u.id)}>
            {u.label}
          </button>
        ))}
      </div>

      <div className="symptom-grid">
        {filtered.map((item) => (
          <article className="symptom-card" key={item.id}>
            <span className={`symptom-badge symptom-badge--${item.urgency === 'high' ? 'high' : 'normal'}`}>
              {item.urgency === 'high' ? 'Терміново' : 'Планово'}
            </span>
            <h3>{item.symptom}</h3>
            <p>{item.what_to_do}</p>
            <Link to={`/appointment?service=${encodeURIComponent(item.service_name || 'Консультація')}`} className="appt-btn appt-btn--solid appt-btn--sm">
              Записатися
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
