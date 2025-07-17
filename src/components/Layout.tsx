
import { ReactNode, useState, useEffect } from 'react';
import Navigation from './Navigation';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className={`p-6 transition-all duration-300 ${isMobile ? 'ml-0' : 'ml-64'}`}>
        <div className={`max-w-7xl mx-auto ${isMobile ? 'pt-16' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
