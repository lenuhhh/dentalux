import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../useAuth';
import { db, supabase, isConfigured } from '../supabaseClient';

const STATUS_LABELS = {
  pending: { label: 'Очікує', cls: 'status--pending' },
  confirmed: { label: 'Підтверджено', cls: 'status--confirmed' },
  cancelled: { label: 'Скасовано', cls: 'status--cancelled' },
  done: { label: 'Завершено', cls: 'status--done' },
};

function Avatar({ email, name, size = 48 }) {
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : (email?.[0] || '?').toUpperCase();

  return (
    <div className="cab-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

export default function CabinetPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('appointments');
  const [profile, setProfile] = useState({});
  const [reminders, setReminders] = useState({ email_enabled: true, sms_enabled: false, telegram_enabled: false });
  const [appointments, setAppointments] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [history, setHistory] = useState([]);
  const [plans, setPlans] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loyalty, setLoyalty] = useState({ points: 0, tier: 'Start', referral_code: '-' });
  const [prevention, setPrevention] = useState({ checkup_every_months: 6, next_checkup_date: '' });
  const [newDoc, setNewDoc] = useState({ title: '', doc_type: 'result', file_url: '' });
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ type: '', msg: '' });

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const showNotice = (type, msg) => {
    setNotice({ type, msg });
    setTimeout(() => setNotice({ type: '', msg: '' }), 4000);
  };

  const loadData = async () => {
    setDataLoading(true);
    try {
      const [prof, prefs, apts, hist, wl, trPlans, docs, prevProgram, loyaltyAccount, paymentInvoices] = await Promise.all([
        db.getUserProfile(user.id),
        db.getReminderPreferences(user.id),
        db.getUserAppointments(user.id),
        db.getTreatmentHistory(user.id),
        db.getAppointmentWaitlist(user.id),
        db.getTreatmentPlans(user.id),
        db.getPatientDocuments(user.id),
        db.getPreventionProgram(user.id),
        db.getLoyaltyAccount(user.id),
        db.getInvoices(user.id),
      ]);
      setProfile(
        prof || {
          full_name: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || '',
        },
      );
      setReminders(prefs || { email_enabled: true, sms_enabled: false, telegram_enabled: false });
      setAppointments(apts || []);
      setHistory(hist || []);
      setWaitlist(wl || []);
      setPlans(trPlans || []);
      setDocuments(docs || []);
      setPrevention(prevProgram || { checkup_every_months: 6, next_checkup_date: '' });
      setLoyalty(loyaltyAccount || { points: 0, tier: 'Start', referral_code: '-' });
      setInvoices(paymentInvoices || []);
    } catch {
      showNotice('error', 'Помилка завантаження даних');
    } finally {
      setDataLoading(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error: err } = await db.updateUserProfile(user.id, profile);
      if (err) {
        throw new Error(err);
      }
      showNotice('success', 'Профіль збережено');
    } catch {
      showNotice('error', 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  const saveReminders = async () => {
    const { error: err } = await db.upsertReminderPreferences(user.id, reminders);
    if (err) {
      showNotice('error', err);
      return;
    }
    showNotice('success', 'Налаштування нагадувань збережено');
  };

  const savePrevention = async () => {
    const { error: err } = await db.upsertPreventionProgram(user.id, prevention);
    if (err) {
      showNotice('error', err);
      return;
    }
    showNotice('success', 'Профілактична програма оновлена');
  };

  const cancelAppointment = async (id) => {
    if (!window.confirm('Скасувати запис?')) {
      return;
    }
    try {
      if (isConfigured) {
        await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
      }
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a)));
      showNotice('success', 'Запис скасовано');
    } catch {
      showNotice('error', 'Помилка скасування');
    }
  };

  const rescheduleAppointment = async (appointment) => {
    const nextDate = window.prompt('Нова дата (YYYY-MM-DD):', appointment.appointment_date || '');
    if (!nextDate) return;
    const nextTime = window.prompt('Новий час (HH:MM):', appointment.appointment_time || '');
    if (!nextTime) return;

    const { error } = await db.rescheduleAppointment(appointment.id, {
      appointment_date: nextDate,
      appointment_time: nextTime,
      doctor_name: appointment.doctor_name,
    });
    if (error) {
      showNotice('error', error);
      return;
    }
    setAppointments((prev) => prev.map((a) => (a.id === appointment.id ? { ...a, appointment_date: nextDate, appointment_time: nextTime } : a)));
    showNotice('success', 'Запис перенесено');
  };

  const addDocument = async (e) => {
    e.preventDefault();
    if (!newDoc.title || !newDoc.file_url) return;

    const { data, error } = await db.addPatientDocument({
      user_id: user.id,
      title: newDoc.title,
      doc_type: newDoc.doc_type,
      file_url: newDoc.file_url,
    });
    if (error) {
      showNotice('error', error);
      return;
    }
    setDocuments((prev) => [data, ...prev]);
    setNewDoc({ title: '', doc_type: 'result', file_url: '' });
    showNotice('success', 'Документ додано');
  };

  const payInvoice = async (invoiceId) => {
    const { data, error } = await db.markInvoicePaid(invoiceId);
    if (error) {
      showNotice('error', error);
      return;
    }
    setInvoices((prev) => prev.map((item) => (item.id === invoiceId ? data : item)));
    showNotice('success', 'Платіж відмічено як сплачений');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="cab-guest">
        <svg viewBox="0 0 48 48" fill="none" width="64" height="64">
          <rect width="48" height="48" rx="14" fill="#183728" />
          <path d="M24 9C18 9 13 14.5 13 20c0 2.6.7 4.8 1.8 6.5 1.1 1.8 2.4 4.7 3 8.9.2 1.2 1 1.8 1.8 1.8s1.6-.6 1.8-1.8c.4-1.8.9-3.6 1.4-3.6s1 1.8 1.4 3.6c.2 1.2.9 1.8 1.8 1.8.8 0 1.6-.6 1.8-1.8.6-4.2 1.9-7.1 3-8.9C36.3 24.8 37 22.6 37 20 37 14.5 30 9 24 9z" fill="#b68f4b" />
          <path d="M19 18.5c.6-1.2 2.4-3 5-3s4.4 1.8 5 3" stroke="#fffdf8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <h2>Особистий кабінет</h2>
        <p>Увійдіть або зареєструйтеся, щоб переглянути свої записи та історію лікування.</p>
        <div className="cab-guest__actions">
          <Link to="/login" className="appt-btn appt-btn--solid">
            Увійти
          </Link>
          <Link to="/register" className="appt-btn appt-btn--ghost">
            Реєстрація
          </Link>
        </div>
      </div>
    );
  }

  const displayName = profile.full_name || user.user_metadata?.full_name || user.email;
  const upcomingCount = appointments.filter((a) => a.status !== 'cancelled' && a.status !== 'done').length;

  const tabs = [
    { id: 'appointments', icon: '📅', label: 'Записи', badge: upcomingCount || null },
    { id: 'history', icon: '📋', label: 'Історія', badge: history.length || null },
    { id: 'plans', icon: '🧭', label: 'План лікування' },
    { id: 'documents', icon: '📁', label: 'Документи', badge: documents.length || null },
    { id: 'finance', icon: '💳', label: 'Оплати', badge: invoices.filter((i) => i.status === 'pending').length || null },
    { id: 'profile', icon: '👤', label: 'Профіль' },
  ];

  return (
    <div className="cab-page">
      {notice.msg && <div className={`cab-notice cab-notice--${notice.type}`}>{notice.msg}</div>}

      <div className="cab-layout">
        <aside className="cab-sidebar">
          <div className="cab-sidebar__user">
            <Avatar email={user.email} name={profile.full_name} size={56} />
            <div>
              <p className="cab-sidebar__name">{displayName}</p>
              <p className="cab-sidebar__email">{user.email}</p>
            </div>
          </div>

          <nav className="cab-nav">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`cab-nav__item${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <span className="cab-nav__icon">{t.icon}</span>
                {t.label}
                {t.badge ? <span className="cab-nav__badge">{t.badge}</span> : null}
              </button>
            ))}
          </nav>

          <div className="cab-sidebar__bottom">
            <Link to="/appointment" className="appt-btn appt-btn--solid cab-sidebar__cta">
              + Новий запис
            </Link>
            <button className="cab-sidebar__logout" onClick={handleLogout}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Вийти
            </button>
          </div>
        </aside>

        <main className="cab-content">
          {dataLoading ? (
            <div className="cab-loader">Завантаження...</div>
          ) : (
            <>
              {tab === 'appointments' && (
                <div>
                  <div className="cab-content__head">
                    <h2>Мої записи</h2>
                    <Link to="/appointment" className="appt-btn appt-btn--solid appt-btn--sm">
                      + Новий запис
                    </Link>
                  </div>
                  {appointments.length === 0 ? (
                    <div className="cab-empty">
                      <p>У вас ще немає записів</p>
                      <Link to="/appointment" className="appt-btn appt-btn--solid">
                        Записатися зараз
                      </Link>
                    </div>
                  ) : (
                    <div className="cab-table-wrap">
                      <table className="cab-table">
                        <thead>
                          <tr>
                            <th>Послуга</th>
                            <th>Дата</th>
                            <th>Час</th>
                            <th>Лікар</th>
                            <th>Статус</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {appointments.map((apt) => {
                            const st = STATUS_LABELS[apt.status] || STATUS_LABELS.pending;
                            const canCancel = apt.status === 'pending' || apt.status === 'confirmed';
                            return (
                              <tr key={apt.id}>
                                <td>
                                  <strong>{apt.service_name || apt.doctor_name || '-'}</strong>
                                </td>
                                <td>{apt.appointment_date || '-'}</td>
                                <td>{apt.appointment_time || '-'}</td>
                                <td>{apt.doctor_name || '-'}</td>
                                <td>
                                  <span className={`cab-status ${st.cls}`}>{st.label}</span>
                                </td>
                                <td>
                                  {canCancel && (
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                      <button className="cab-table__cancel" onClick={() => cancelAppointment(apt.id)}>
                                        Скасувати
                                      </button>
                                      <button className="cab-table__cancel" onClick={() => rescheduleAppointment(apt)}>
                                        Перенести
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'history' && (
                <div>
                  <div className="cab-content__head">
                    <h2>Історія лікування</h2>
                  </div>
                  {history.length === 0 ? (
                    <div className="cab-empty">
                      <p>Історія лікування порожня</p>
                    </div>
                  ) : (
                    <div className="cab-table-wrap">
                      <table className="cab-table">
                        <thead>
                          <tr>
                            <th>Процедура</th>
                            <th>Дата</th>
                            <th>Лікар</th>
                            <th>Вартість</th>
                            <th>Нотатки</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <strong>{item.procedure_name || item.notes || '-'}</strong>
                              </td>
                              <td>{item.treatment_date || '-'}</td>
                              <td>{item.doctor_name || '-'}</td>
                              <td>{item.cost ? <span className="cab-price">{item.cost} {item.currency || 'грн'}</span> : '-'}</td>
                              <td className="cab-table__notes">{item.notes || '-'}</td>
                              <td>
                                <Link
                                  className="cab-table__cancel"
                                  to={`/appointment?service=${encodeURIComponent(item.procedure_name || 'Консультація')}`}
                                >
                                  Повторити
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="cab-grid" style={{ marginTop: '20px' }}>
                    <div className="cab-card">
                      <h3>Таймлайн лікування</h3>
                      {history.slice(0, 4).map((item) => (
                        <div key={`tl-${item.id}`} className="cab-line-item">
                          <strong>{item.treatment_date || '-'}</strong>
                          <span>{item.procedure_name || item.notes || 'Візит'}</span>
                        </div>
                      ))}
                    </div>
                    <div className="cab-card">
                      <h3>Лояльність і рекомендації</h3>
                      <p><strong>{loyalty.points || 0}</strong> бонусів · Рівень: {loyalty.tier || 'Start'}</p>
                      <p>Реферальний код: <strong>{loyalty.referral_code || '-'}</strong></p>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'plans' && (
                <div>
                  <div className="cab-content__head">
                    <h2>Персональний план лікування</h2>
                  </div>

                  {plans.length === 0 ? (
                    <div className="cab-empty">
                      <p>Поки що план не сформовано. Після консультації він з’явиться тут.</p>
                    </div>
                  ) : (
                    <div className="cab-grid">
                      {plans.map((plan) => (
                        <article key={plan.id} className="cab-card">
                          <h3>{plan.title}</h3>
                          <p>Етап: {plan.stage}</p>
                          <p>Прогрес: {plan.progress_percent || 0}%</p>
                          <p>Наступний крок: {plan.next_step || '-'}</p>
                          <p>Орієнтовна вартість: {plan.estimated_cost ? `${plan.estimated_cost} грн` : '-'}</p>
                        </article>
                      ))}
                    </div>
                  )}

                  <div className="cab-grid" style={{ marginTop: '18px' }}>
                    <article className="cab-card">
                      <h3>Програма профілактики</h3>
                      <div className="appt-fields">
                        <div className="field">
                          <label className="field__label">Частота check-up (міс.)</label>
                          <input
                            className="field__input"
                            type="number"
                            min="3"
                            max="12"
                            value={prevention.checkup_every_months || 6}
                            onChange={(e) => setPrevention({ ...prevention, checkup_every_months: Number(e.target.value) })}
                          />
                        </div>
                        <div className="field">
                          <label className="field__label">Наступний візит</label>
                          <input
                            className="field__input"
                            type="date"
                            value={prevention.next_checkup_date || ''}
                            onChange={(e) => setPrevention({ ...prevention, next_checkup_date: e.target.value })}
                          />
                        </div>
                      </div>
                      <button className="appt-btn appt-btn--solid" onClick={savePrevention}>Оновити програму</button>
                    </article>

                    <article className="cab-card">
                      <h3>Лист очікування</h3>
                      {waitlist.length === 0 ? (
                        <p>Ви поки не в листі очікування.</p>
                      ) : (
                        waitlist.slice(0, 5).map((item) => (
                          <div key={item.id} className="cab-line-item">
                            <strong>{item.service_name}</strong>
                            <span>{item.preferred_date || 'будь-яка дата'} · {item.status}</span>
                          </div>
                        ))
                      )}
                    </article>
                  </div>
                </div>
              )}

              {tab === 'documents' && (
                <div>
                  <div className="cab-content__head">
                    <h2>Документи пацієнта</h2>
                  </div>

                  <form className="cab-card" onSubmit={addDocument} style={{ marginBottom: '18px' }}>
                    <div className="appt-fields">
                      <div className="field">
                        <label className="field__label">Назва документа</label>
                        <input
                          className="field__input"
                          value={newDoc.title}
                          onChange={(e) => setNewDoc((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="КТ верхньої щелепи"
                          required
                        />
                      </div>
                      <div className="field">
                        <label className="field__label">Тип</label>
                        <select
                          className="field__input"
                          value={newDoc.doc_type}
                          onChange={(e) => setNewDoc((prev) => ({ ...prev, doc_type: e.target.value }))}
                        >
                          <option value="result">Результат</option>
                          <option value="xray">Знімок</option>
                          <option value="prescription">Призначення</option>
                        </select>
                      </div>
                      <div className="field">
                        <label className="field__label">Посилання на файл</label>
                        <input
                          className="field__input"
                          type="url"
                          value={newDoc.file_url}
                          onChange={(e) => setNewDoc((prev) => ({ ...prev, file_url: e.target.value }))}
                          placeholder="https://..."
                          required
                        />
                      </div>
                    </div>
                    <button className="appt-btn appt-btn--solid" type="submit">Додати документ</button>
                  </form>

                  {documents.length === 0 ? (
                    <div className="cab-empty">
                      <p>Документи ще не додані</p>
                    </div>
                  ) : (
                    <div className="cab-grid">
                      {documents.map((doc) => (
                        <article className="cab-card" key={doc.id}>
                          <h3>{doc.title}</h3>
                          <p>Тип: {doc.doc_type || '-'}</p>
                          <a href={doc.file_url} target="_blank" rel="noreferrer">Відкрити документ</a>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'finance' && (
                <div>
                  <div className="cab-content__head">
                    <h2>Онлайн-оплата і передплата</h2>
                  </div>

                  {invoices.length === 0 ? (
                    <div className="cab-empty"><p>Наразі немає інвойсів до оплати.</p></div>
                  ) : (
                    <div className="cab-table-wrap">
                      <table className="cab-table">
                        <thead>
                          <tr>
                            <th>Сума</th>
                            <th>Статус</th>
                            <th>Провайдер</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((invoice) => (
                            <tr key={invoice.id}>
                              <td>{invoice.amount} {invoice.currency || 'UAH'}</td>
                              <td>{invoice.status}</td>
                              <td>{invoice.provider || 'manual'}</td>
                              <td>
                                {invoice.status !== 'paid' ? (
                                  <button className="cab-table__cancel" onClick={() => payInvoice(invoice.id)}>Сплатити</button>
                                ) : 'Сплачено'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'profile' && (
                <div>
                  <div className="cab-content__head">
                    <h2>Профіль</h2>
                  </div>
                  <div className="cab-profile">
                    <div className="cab-profile__avatar-area">
                      <Avatar email={user.email} name={profile.full_name} size={80} />
                      <div>
                        <p className="cab-profile__name">{displayName}</p>
                        <p className="cab-profile__since">Пацієнт з {new Date(user.created_at || Date.now()).getFullYear()} р.</p>
                      </div>
                    </div>
                    <form className="cab-profile__form" onSubmit={saveProfile}>
                      <div className="appt-fields">
                        <div className="field">
                          <label className="field__label" htmlFor="prof-name">ПІБ</label>
                          <input
                            id="prof-name"
                            className="field__input"
                            type="text"
                            value={profile.full_name || ''}
                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                            placeholder="Іваненко Іван Іванович"
                          />
                        </div>
                        <div className="field">
                          <label className="field__label">Email</label>
                          <input className="field__input" type="email" value={user.email} disabled />
                        </div>
                        <div className="field">
                          <label className="field__label" htmlFor="prof-phone">Телефон</label>
                          <input
                            id="prof-phone"
                            className="field__input"
                            type="tel"
                            value={profile.phone || ''}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            placeholder="+38 (0__) ___-__-__"
                          />
                        </div>
                        <div className="field">
                          <label className="field__label" htmlFor="prof-birth">Дата народження</label>
                          <input
                            id="prof-birth"
                            className="field__input field__input--date"
                            type="date"
                            value={profile.birth_date || ''}
                            onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
                          />
                        </div>
                      </div>
                      <button className="appt-btn appt-btn--solid" type="submit" disabled={saving}>
                        {saving ? 'Збереження...' : 'Зберегти зміни'}
                      </button>
                    </form>

                    <div className="cab-card" style={{ marginTop: '18px' }}>
                      <h3>Нагадування про прийоми</h3>
                      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        <label><input type="checkbox" checked={reminders.email_enabled} onChange={(e) => setReminders({ ...reminders, email_enabled: e.target.checked })} /> Email</label>
                        <label><input type="checkbox" checked={reminders.sms_enabled} onChange={(e) => setReminders({ ...reminders, sms_enabled: e.target.checked })} /> SMS</label>
                        <label><input type="checkbox" checked={reminders.telegram_enabled} onChange={(e) => setReminders({ ...reminders, telegram_enabled: e.target.checked })} /> Telegram</label>
                      </div>
                      <button className="appt-btn appt-btn--solid" type="button" onClick={saveReminders}>Зберегти нагадування</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
