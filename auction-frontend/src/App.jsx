import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import LandingPage from './pages/LandingPage';
import RoleSelection from './pages/RoleSelection';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import PlayersPage from './pages/PlayersPage';
import TeamsPage from './pages/TeamsPage';
import AuctionPage from './pages/AuctionPage';
import StatisticsPage from './pages/StatisticsPage';
import BiddingRulesPage from './pages/BiddingRulesPage';

function App() {
  return (
    <ErrorBoundary>
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/role/:city" element={<RoleSelection />} />
          <Route path="/login/:city" element={<AdminLogin />} />

          {/* Nested Dashboard Routes */}
          <Route path="/dashboard/:city/:role" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="players" element={<PlayersPage />} />
            <Route path="teams" element={<TeamsPage />} />
            <Route path="auction" element={<AuctionPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="rules" element={<BiddingRulesPage />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
