import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import InstallPrompt from './InstallPrompt';
import usePageMeta from '../hooks/usePageMeta';

export default function Layout() {
  usePageMeta();
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '54px' }}>
        <Outlet />
      </main>
      <Footer />
      <InstallPrompt />
    </>
  );
}
