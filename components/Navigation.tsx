import React, { useState, useEffect } from 'react';
import { LOGO_BASE64 } from '../constants_logo';
import { useSettings } from '../contexts/SettingsContext';


interface NavigationProps {
  onNavigate: (page: any) => void;
  currentPage: string;
}

export const Navigation: React.FC<NavigationProps> = ({ onNavigate, currentPage }) => {
  const { settings } = useSettings();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (elementId: string) => {
    // Close mobile menu immediately for better UX
    setIsMobileMenuOpen(false);

    if (currentPage !== 'HOME') {
      onNavigate('HOME');
      setTimeout(() => {
        const element = document.getElementById(elementId);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(elementId);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOwnerClick = () => {
    window.open(`https://wa.me/${settings.whatsapp}?text=Ol%C3%A1%2C%20tenho%20um%20im%C3%B3vel%20em%20Moeda%20e%20gostaria%20de%20anunciar%20no%20Concierge.`, '_blank');
  };


  return (
    <header
      className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300"
      style={{
        height: isScrolled ? '70px' : '80px',
        transition: 'height var(--transition-base)'
      }}
    >
      {/* Scroll Progress Bar */}
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-primary transition-all duration-100"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="flex items-center justify-between transition-all duration-300"
          style={{ height: isScrolled ? '70px' : '80px' }}
        >
          {/* Logo Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group h-full py-1"
            onClick={() => { onNavigate('HOME'); setIsMobileMenuOpen(false); }}
          >
            {/* Logo Container - Clean, no mask, just the image */}
            <div className="relative h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center">
              <img
                src={LOGO_BASE64}
                alt="Concierge Moeda Logo"
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>

            <div className="flex flex-col justify-center h-full">
              <span className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-primary leading-none">Concierge</span>
              <span className="text-[10px] sm:text-xs font-sans font-bold tracking-[0.2em] uppercase text-secondary leading-tight mt-0.5">Moeda-MG</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => onNavigate('HOME')}
              className={`text-sm font-medium transition-colors ${currentPage === 'HOME' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
            >
              Início
            </button>
            <button
              onClick={() => handleScrollTo('properties-section')}
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              Propriedades
            </button>
            <button
              onClick={() => handleScrollTo('features-section')}
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              Experiências
            </button>
          </nav>

          {/* CTA & Login */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={handleOwnerClick}
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary-dark hover:-translate-y-0.5 transition-all duration-200 gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">add_home</span>
              <span>Anuncie seu Imóvel</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined transition-transform duration-300">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-2xl z-40 animate-fade-in-down origin-top">
          <nav className="flex flex-col p-4 gap-2">
            <button
              onClick={() => { onNavigate('HOME'); setIsMobileMenuOpen(false); }}
              className={`text-left font-medium py-3 px-4 rounded-lg transition-colors flex items-center gap-3 ${currentPage === 'HOME' ? 'bg-primary/5 text-primary' : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <span className="material-symbols-outlined text-lg">home</span>
              Início
            </button>
            <button
              onClick={() => handleScrollTo('properties-section')}
              className="text-left font-medium text-gray-600 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-lg">house</span>
              Propriedades
            </button>
            <button
              onClick={() => handleScrollTo('features-section')}
              className="text-left font-medium text-gray-600 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-lg">explore</span>
              Experiências
            </button>

            <div className="h-px bg-gray-100 my-2 mx-2"></div>


            <button
              onClick={() => { handleOwnerClick(); setIsMobileMenuOpen(false); }}
              className="mt-2 w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">add_home</span>
              Anuncie seu Imóvel
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};