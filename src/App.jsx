import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FinnhubProvider } from './context/FinnhubContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Screener from './pages/Screener';
import Calculator from './pages/Calculator';
import Framework from './pages/Framework';
import Methodology from './pages/Methodology';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import Blog from './pages/Blog';
import Performance from './pages/Performance';

export default function App() {
  return (
    <BrowserRouter>
    <FinnhubProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/screener" element={<Screener />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/framework" element={<Framework />} />
          <Route path="/methodology" element={<Methodology />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/callback" element={<div style={{ padding: '6rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>OAuth callback handler. Redirecting...</div>} />
        </Route>
      </Routes>
    </FinnhubProvider>
    </BrowserRouter>
  );
}
