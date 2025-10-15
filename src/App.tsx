import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import LoginForm from './components/LoginForm';
import AdminDashboard from './components/AdminDashboard';
import HomePage from './components/HomePage';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<'home' | 'login'>('home');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleShowLogin = () => setView('login');
  const handleReturnHome = () => setView('home');
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('home'); // Return to home page after logout
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading Application...</p>
      </div>
    );
  }

  if (session) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (view === 'login') {
    return <LoginForm onReturnHome={handleReturnHome} />;
  }

  return <HomePage onAdminLoginClick={handleShowLogin} />;
}

export default App;
