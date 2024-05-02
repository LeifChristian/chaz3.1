import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

// Replace the createRoot method with the render method
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
