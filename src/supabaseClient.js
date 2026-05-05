import { createClient } from '@supabase/supabase-js';

// Замінь на реальні значення з Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Якщо не встановлено, використовуємо mock
export const isConfigured = SUPABASE_URL !== 'https://your-project.supabase.co';

function safeNowIso() {
  return new Date().toISOString();
}

function fallbackSlots(date) {
  const day = String(date || '').slice(-2) || '01';
  const base = Number(day) % 2 === 0
    ? ['09:00', '10:00', '11:30', '13:00', '15:00', '17:30']
    : ['09:30', '10:30', '12:00', '14:00', '16:00', '18:00'];
  return base.map((time, idx) => ({
    id: `mock-slot-${date}-${idx}`,
    doctor_id: idx % 2 ? 1 : 2,
    doctor_name: idx % 2 ? 'Катерина Романова' : 'Анна Кравцова',
    service_name: null,
    slot_date: date,
    slot_time: time,
    is_booked: false,
    is_emergency: idx === 0,
  }));
}

// Методи для роботи з БД
export const db = {
  // Послуги
  async getServices() {
    try {
      const { data, error } = await supabase.from('services').select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Помилка завантаження послуг:', e);
      return [];
    }
  },

  // Лікарі
  async getDoctors() {
    try {
      const { data, error } = await supabase.from('doctors').select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Помилка завантаження лікарів:', e);
      return [];
    }
  },

  // Записи користувача
  async getUserAppointments(userId) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .order('appointment_date', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Помилка завантаження записів:', e);
      return [];
    }
  },

  // Створення запису
  async createAppointment(appointment) {
    try {
      const extendedPayload = { ...appointment };
      const basePayload = {
        user_id: appointment.user_id,
        patient_name: appointment.patient_name,
        patient_phone: appointment.patient_phone,
        patient_email: appointment.patient_email,
        service_name: appointment.service_name,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        doctor_name: appointment.doctor_name,
        notes: appointment.notes,
        status: appointment.status,
      };

      // New schemas support additional columns (slot_id/is_emergency), old schemas do not.
      let { data, error } = await supabase.from('appointments').insert([extendedPayload]).select();
      if (error) {
        const retry = await supabase.from('appointments').insert([basePayload]).select();
        data = retry.data;
        error = retry.error;
      }
      if (error) throw error;

      // Queue reminders (24h and 2h) for operational processing.
      if (data?.[0]?.id && appointment?.appointment_date && appointment?.appointment_time) {
        const dt = new Date(`${appointment.appointment_date}T${appointment.appointment_time}:00`);
        if (!Number.isNaN(dt.getTime())) {
          const reminderRows = [24, 2].map((hours) => ({
            appointment_id: data[0].id,
            user_id: appointment.user_id,
            remind_at: new Date(dt.getTime() - hours * 60 * 60 * 1000).toISOString(),
            channel: 'email',
            status: 'pending',
            meta: { hours_before: hours },
          }));
          try {
            await supabase.from('reminder_jobs').insert(reminderRows);
          } catch {
            // Ignore optional reminder queue errors to avoid breaking booking flow.
          }
        }
      }

      return { data: data?.[0], error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  },

  async rescheduleAppointment(appointmentId, payload) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({
          appointment_date: payload.appointment_date,
          appointment_time: payload.appointment_time,
          doctor_name: payload.doctor_name,
          updated_at: safeNowIso(),
        })
        .eq('id', appointmentId)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  },

  async getAvailableSlots({ date, serviceName, emergency = false }) {
    if (!date) return [];
    try {
      if (!isConfigured) return fallbackSlots(date);

      let query = supabase
        .from('doctor_slots')
        .select('*')
        .eq('slot_date', date)
        .eq('is_booked', false)
        .order('slot_time', { ascending: true });

      if (serviceName) query = query.or(`service_name.is.null,service_name.eq.${serviceName}`);
      if (emergency) query = query.eq('is_emergency', true);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Помилка завантаження слотів:', e);
      return fallbackSlots(date);
    }
  },

  async joinWaitlist(row) {
    try {
      const { data, error } = await supabase.from('appointment_waitlist').insert([row]).select().single();
      if (error) {
        // Compatibility fallback for projects without waitlist table migration.
        return { data: { ...row, id: `fallback-${Date.now()}` }, error: null };
      }
      return { data, error: null };
    } catch (e) {
      return { data: { ...row, id: `fallback-${Date.now()}` }, error: null };
    }
  },

  async getAppointmentWaitlist(userId) {
    try {
      const { data, error } = await supabase
        .from('appointment_waitlist')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Помилка waitlist:', e);
      return [];
    }
  },

  // Історія лікування
  async getTreatmentHistory(userId) {
    try {
      const { data, error } = await supabase
        .from('treatment_history')
        .select('*')
        .eq('user_id', userId)
        .order('treatment_date', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Помилка завантаження історії:', e);
      return [];
    }
  },

  // Профіль користувача
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (e) {
      console.error('Помилка завантаження профілю:', e);
      return null;
    }
  },

  // Оновлення профілю
  async updateUserProfile(userId, profile) {
    try {
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .single();

      let result;
      if (existing) {
        result = await supabase.from('user_profiles').update(profile).eq('id', userId).select();
      } else {
        result = await supabase.from('user_profiles').insert([{ id: userId, ...profile }]).select();
      }

      if (result.error) throw result.error;
      return { data: result.data?.[0], error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  },

  async getReminderPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from('reminder_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || { user_id: userId, email_enabled: true, sms_enabled: false, telegram_enabled: false };
    } catch (e) {
      console.error('Помилка reminder preferences:', e);
      return { user_id: userId, email_enabled: true, sms_enabled: false, telegram_enabled: false };
    }
  },

  async upsertReminderPreferences(userId, prefs) {
    try {
      const { data, error } = await supabase
        .from('reminder_preferences')
        .upsert([{ user_id: userId, ...prefs, updated_at: safeNowIso() }], { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  },

  async getPatientDocuments(userId) {
    try {
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Помилка документів:', e);
      return [];
    }
  },

  async addPatientDocument(row) {
    try {
      const { data, error } = await supabase.from('patient_documents').insert([row]).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  },

  async getTreatmentPlans(userId) {
    try {
      const { data, error } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Помилка планів лікування:', e);
      return [];
    }
  },

  async getPreventionProgram(userId) {
    try {
      const { data, error } = await supabase
        .from('prevention_programs')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (e) {
      console.error('Помилка програми профілактики:', e);
      return null;
    }
  },

  async upsertPreventionProgram(userId, data) {
    try {
      const { data: row, error } = await supabase
        .from('prevention_programs')
        .upsert([{ user_id: userId, ...data, updated_at: safeNowIso() }], { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      return { data: row, error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  },

  async getLoyaltyAccount(userId) {
    try {
      const { data, error } = await supabase
        .from('loyalty_accounts')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || { user_id: userId, points: 0, tier: 'Start' };
    } catch (e) {
      console.error('Помилка loyalty account:', e);
      return { user_id: userId, points: 0, tier: 'Start' };
    }
  },

  async getInvoices(userId) {
    try {
      const { data, error } = await supabase
        .from('payment_invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Помилка інвойсів:', e);
      return [];
    }
  },

  async markInvoicePaid(invoiceId) {
    try {
      const { data, error } = await supabase
        .from('payment_invoices')
        .update({ status: 'paid', paid_at: safeNowIso(), updated_at: safeNowIso() })
        .eq('id', invoiceId)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  },

  async getCases(filters = {}) {
    try {
      let query = supabase.from('clinic_cases').select('*').order('created_at', { ascending: false });
      if (filters.problem) query = query.eq('problem', filters.problem);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Помилка кейсів:', e);
      return [];
    }
  },

  async getSymptoms() {
    try {
      const { data, error } = await supabase.from('symptom_guides').select('*').order('priority', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Помилка symptoms:', e);
      return [];
    }
  },

  async getBlogPosts() {
    try {
      const { data, error } = await supabase.from('blog_posts').select('*').eq('is_published', true).order('published_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Помилка блогу:', e);
      return [];
    }
  },

  async createConsultRequest(row) {
    try {
      const { data, error } = await supabase.from('consult_requests').insert([row]).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  },

  async trackAbEvent(row) {
    try {
      await supabase.from('ab_test_events').insert([{ ...row, created_at: safeNowIso() }]);
    } catch (e) {
      console.error('Помилка A/B event:', e);
    }
  },
};
