import React, { useState, useEffect, Suspense } from 'react';
import { Navigation } from './components/Navigation';
// Lazy Imports
const HomePage = React.lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const PropertyDetails = React.lazy(() => import('./pages/PropertyDetails').then(module => ({ default: module.PropertyDetails })));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PropertiesProvider } from './contexts/PropertiesContext';
import { Page, Property } from './types';
import { useProperties } from './hooks/useProperties';
import { LOGO_BASE64 } from './constants_logo';
import { ToastProvider } from './components/Toast';

import { SettingsProvider, useSettings } from './contexts/SettingsContext';


const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('HOME');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { settings } = useSettings();
  const { properties } = useProperties();

  // Sync state with URL on mount and popstate
  useEffect(() => {
    const handleLocationChange = () => {
      // Logic for /admin hidden route
      if (window.location.pathname === '/admin') {
        setCurrentPage('LOGIN');
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('p') as Page;
      const idParam = params.get('id');

      if (pageParam) {
        setCurrentPage(pageParam);
      }
      if (idParam) {
        setSelectedPropertyId(idParam);
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (page: Page, id?: string) => {
    const params = new URLSearchParams();
    params.set('p', page);
    if (id) params.set('id', id);

    // Update URL history
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ page, id }, '', newUrl);

    if (id) setSelectedPropertyId(id);
    else setSelectedPropertyId(null);

    // Protection Rule: If trying to go to Admin without user, go to Login
    if (page === 'ADMIN_DASHBOARD' && !user) {
      setCurrentPage('LOGIN');
      return;
    }

    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Redirect if on Login but already logged in
  useEffect(() => {
    if (user && currentPage === 'LOGIN') {
      navigateTo('ADMIN_DASHBOARD');
    }
  }, [user, currentPage]);

  const renderPage = () => {
    if (authLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    switch (currentPage) {
      case 'HOME':
        return (
          <HomePage
            onNavigate={navigateTo}
            onPropertySelect={(prop) => navigateTo('DETAILS', prop.id)}
          />
        );
      case 'DETAILS':
        const property = properties.find(p => p.id === selectedPropertyId);
        return property ? (
          <PropertyDetails
            property={property}
            onBack={() => navigateTo('HOME')}
          />
        ) : (
          // Fallback content or loading
          <HomePage
            onNavigate={navigateTo}
            onPropertySelect={(prop) => navigateTo('DETAILS', prop.id)}
          />
        );
      case 'LOGIN':
        return <LoginPage onLoginSuccess={() => navigateTo('ADMIN_DASHBOARD')} />;
      case 'ADMIN_DASHBOARD':
        return user ? (
          <AdminDashboard onNavigate={navigateTo} />
        ) : (
          <LoginPage onLoginSuccess={() => navigateTo('ADMIN_DASHBOARD')} />
        );
      default:
        return (
          <HomePage
            onNavigate={navigateTo}
            onPropertySelect={(prop) => navigateTo('DETAILS', prop.id)}
          />
        );
    }
  };

  return (
    <div className="font-sans text-gray-900 bg-background-light min-h-screen">
      {/* Show Nav on public pages */}
      {['HOME', 'DETAILS'].includes(currentPage) && (
        <Navigation onNavigate={navigateTo} currentPage={currentPage} />
      )}

      <Suspense fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium animate-pulse">Carregando...</p>
          </div>
        </div>
      }>
        {renderPage()}
      </Suspense>

      {/* Footer (only on public pages) */}
      {['HOME', 'DETAILS'].includes(currentPage) && (
        <footer className="bg-surface-dark text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img src={LOGO_BASE64} alt="Concierge Moeda Logo" className="h-12 w-12 object-contain" />
                <span className="font-serif font-bold text-2xl tracking-tight">Concierge Moeda</span>
              </div>
              <p className="text-gray-400 max-w-sm text-sm leading-relaxed">
                Especialistas em conectar hóspedes exigentes às melhores propriedades da região. Vivencie o charme mineiro com sofisticação.
              </p>
            </div>
            {/* Footer links omitted for brevity but keeping structure */}
            <div className="text-gray-500 text-sm">
              <p>Contato: {settings.formattedWhatsapp}</p>
              <p>{settings.email}</p>
            </div>

          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-xs">
            © 2026 Concierge Moeda. Todos os direitos reservados.
          </div>
        </footer>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <PropertiesProvider>
        <SettingsProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </SettingsProvider>
      </PropertiesProvider>
    </AuthProvider>

  );
};

export default App;