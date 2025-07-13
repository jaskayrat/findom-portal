import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Этот файл является точкой входа в ваше приложение.
// Он находит элемент с id 'root' в index.html и рендерит в нем главный компонент App.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
