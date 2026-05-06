import { useState, useEffect } from 'react';
import { supabase, isConfigured } from './supabaseClient';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const { data, error: err } = await supabase.auth.getSession();
        if (err) {
          console.error('Auth error:', err);
          setError(null); // Не показуємо помилку користувачу
        }
        setUser(data?.session?.user || null);
      } catch (e) {
        console.error('Session check failed:', e);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      try {
        listener?.subscription?.unsubscribe?.();
      } catch (e) {
        console.error('Unsubscribe error:', e);
      }
    };
  }, []);

  const login = async (email, password) => {
    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const normalizedPassword = String(password || '');

      if (!normalizedEmail || !normalizedPassword) {
        return { error: { message: 'Введіть email і пароль.' } };
      }

      if (!isConfigured) {
        // Mock login
        setUser({ email: normalizedEmail, id: 'mock-' + Date.now() });
        return { error: null };
      }
      const { error: err } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      });

      if (err) {
        const message = String(err.message || '').toLowerCase();
        if (message.includes('invalid login credentials')) {
          return { error: { message: 'Невірний email або пароль.' } };
        }
        if (message.includes('email not confirmed')) {
          return { error: { message: 'Підтвердіть email у пошті, а потім увійдіть.' } };
        }
      }

      return { error: err };
    } catch (e) {
      console.error('Login error:', e);
      return { error: { message: 'Помилка входу. Спробуйте ще раз.' } };
    }
  };

  const signUp = async (email, password, meta = {}) => {
    try {
      if (!isConfigured) {
        setUser({ email, id: 'mock-' + Date.now(), user_metadata: meta });
        return { error: null, session: { user: { email } } };
      }
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: meta },
      });
      // If Supabase has email confirmation disabled, a session is returned immediately
      if (!err && data?.session) {
        setUser(data.session.user);
      }
      return { error: err, session: data?.session || null };
    } catch (e) {
      console.error('Signup error:', e);
      return { error: { message: 'Помилка реєстрації. Спробуйте ще раз.' }, session: null };
    }
  };

  const logout = async () => {
    try {
      if (!isConfigured) {
        setUser(null);
        return { error: null };
      }
      const { error: err } = await supabase.auth.signOut();
      setUser(null);
      return { error: err };
    } catch (e) {
      console.error('Logout error:', e);
      setUser(null);
      return { error: null };
    }
  };

  return { user, loading, error, login, signUp, logout };
}
