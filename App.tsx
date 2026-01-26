import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { PropertyDetails } from './pages/PropertyDetails';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PropertiesProvider } from './contexts/PropertiesContext';
import { Page, Property } from './types';
import { useProperties } from './hooks/useProperties';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('HOME');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { properties } = useProperties(); // Fetch properties for details view

  const navigateTo = (page: Page, id?: string) => {
    if (id) setSelectedPropertyId(id);

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
      setCurrentPage('ADMIN_DASHBOARD');
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

      {renderPage()}

      {/* Footer (only on public pages) */}
      {['HOME', 'DETAILS'].includes(currentPage) && (
        <footer className="bg-surface-dark text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-4xl text-primary">landscape</span>
                <span className="font-serif font-bold text-xl">Concierge Moeda</span>
              </div>
              <p className="text-gray-400 max-w-sm text-sm leading-relaxed">
                Especialistas em conectar hóspedes exigentes às melhores propriedades da região. Vivencie o charme mineiro com sofisticação.
              </p>
            </div>
            {/* Footer links omitted for brevity but keeping structure */}
            <div className="text-gray-500 text-sm">
              <p>Contato: (31) 99999-9999</p>
              <p>contato@conciergemoeda.com.br</p>
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
        <AppContent />
      </PropertiesProvider>
    </AuthProvider>
  );
};

export default App;