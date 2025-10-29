
import React, { useState, useCallback } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { PdvScreen } from './components/PdvScreen';
import { NfceReceipt } from './components/NfceReceipt';
import { User, Sale } from './types';
import { MOCK_USERS } from './data/mockData';

type View = 'login' | 'pdv' | 'receipt';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('login');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const handleLogin = useCallback((username: string): boolean => {
    const user = MOCK_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (user) {
      setCurrentUser(user);
      setCurrentView('pdv');
      return true;
    }
    return false;
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setCurrentView('login');
    setCompletedSale(null);
  }, []);
  
  const handleSaleComplete = useCallback((sale: Sale) => {
    setCompletedSale(sale);
    setCurrentView('receipt');
  }, []);

  const handleNewSale = useCallback(() => {
    setCompletedSale(null);
    setCurrentView('pdv');
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return <LoginScreen onLogin={handleLogin} />;
      case 'pdv':
        if (currentUser) {
          return <PdvScreen user={currentUser} onLogout={handleLogout} onSaleComplete={handleSaleComplete} />;
        }
        return <LoginScreen onLogin={handleLogin} />; // Fallback para login
      case 'receipt':
        if (completedSale) {
          return <NfceReceipt sale={completedSale} onNewSale={handleNewSale} />;
        }
        return <PdvScreen user={currentUser!} onLogout={handleLogout} onSaleComplete={handleSaleComplete} />; // Fallback para PDV
      default:
        return <LoginScreen onLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {renderContent()}
    </div>
  );
};

export default App;
