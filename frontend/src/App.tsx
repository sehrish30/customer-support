import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.js';
import ArticlePage from './pages/ArticlePage.js';

export default function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/article/:topic" element={<ArticlePage />} />
    </Routes>
  );
}
