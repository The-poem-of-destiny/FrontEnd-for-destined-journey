import { createRoot } from 'react-dom/client';
import App from './App';
import './shared/styles/index.scss';

$(() => {
  const container = document.getElementById('app');
  if (container) {
    const root = createRoot(container);
    root.render(<App />);
  }
});
