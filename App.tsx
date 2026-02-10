import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Goals from './pages/Goals';
import Settings from './pages/Settings';
import Planning from './pages/Planning';
import Onboarding from './pages/Onboarding';
import Achievements from './pages/Achievements';
import { LockScreen } from './components/LockScreen';

const AppRoutes = () => {
  const { user, isLocked } = useFinance();

  if (!user.onboardingCompleted) {
    return <Onboarding />;
  }

  // Se o app estiver bloqueado por PIN, mostra a tela de bloqueio
  if (isLocked) {
    return <LockScreen />;
  }

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

function App() {
  return (
    <FinanceProvider>
      <AppRoutes />
    </FinanceProvider>
  );
}

export default App;