import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// Обработка ошибок при рендеринге
const root = document.getElementById('root');

if (!root) {
  console.error('Root element not found');
  document.body.innerHTML = '<p>Помилка завантаження додатку. Перезавантажте сторінку.</p>';
} else {
  try {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('App render error:', error);
    root.innerHTML = '<p>Помилка завантаження додатку. Перезавантажте сторінку.</p>';
  }
}

// Обработка ошибок JavaScript
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
});
