import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import AdminDashboard from './components/AdminDashboard';
import HomePage from './components/HomePage';

function App() {
  const [view, setView] = useState<'home' | 'login' | 'admin'>('home');

  const handleShowLogin = () => setView('login');
  const handleLogin = () => setView('admin');
  const handleLogout = () => setView('home');
  const handleReturnHome = () => setView('home');

  if (view === 'login') {
    return <LoginForm onLogin={handleLogin} onReturnHome={handleReturnHome} />;
  }

  if (view === 'admin') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return <HomePage onAdminLoginClick={handleShowLogin} />;
}

export default App;
