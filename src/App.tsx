import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Wallet from './pages/Wallet';
import MyBets from './pages/MyBets';
import MatchDetails from './pages/MatchDetails';
import CardDetails from './pages/CardDetails';
import Profile from './pages/Profile';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Support from './pages/Support';
import Activity from './pages/Activity';
import { ChatProvider } from './context/ChatContext';
import LiveChat from './components/LiveChat';
import WinnerCelebration from './components/WinnerCelebration';
import BottomNav from './components/BottomNav';
import LiveMatches from './pages/LiveMatches';
import Participants from './pages/Participants';
import Winners from './pages/Winners';
import NotificationManager from './components/NotificationManager';
import Rules from './pages/Rules';

import { BalanceProvider } from './context/BalanceContext';
import { AdminProvider } from './context/AdminContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AdminDashboardProvider } from './context/AdminDashboardContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { AuthProvider } from './context/AuthContext';

import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const RootNavigator = () => {
  const { currentUser, loading } = useAuth();
  const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');

  if (loading) {
    return <Splash />;
  }

  if (currentUser) {
    return <Navigate to="/home" />;
  }

  if (hasSeenOnboarding) {
    return <Navigate to="/auth" />;
  }

  return <Navigate to="/onboarding" />;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const showNav = ['/home', '/wallet', '/my-bets', '/rules', '/profile', '/support'].includes(location.pathname) || location.pathname.startsWith('/match/');

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      document.body.classList.add('admin-mode');
    } else {
      document.body.classList.remove('admin-mode');
    }
    return () => {
      document.body.classList.remove('admin-mode');
    };
  }, [location.pathname]);

  const showLiveChat = currentUser && !location.pathname.startsWith('/admin') && location.pathname !== '/auth';

  return (
    <>
      <div key={location.pathname} className="page-wrapper" style={{ minHeight: '100vh', width: '100%', paddingBottom: showNav ? '100px' : '0' }}>
        <Routes location={location}>
          <Route path="/" element={<RootNavigator />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/home" element={<Home />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/my-bets" element={<MyBets />} />
          <Route path="/match/:id" element={<MatchDetails />} />
          <Route path="/match/:matchId/card/:cardId" element={<CardDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/support" element={<Support />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/live-matches" element={<LiveMatches />} />
          <Route path="/participants" element={<Participants />} />
          <Route path="/winners" element={<Winners />} />
        </Routes>
      </div>
      {showNav && <BottomNav />}
      {showLiveChat && <LiveChat />}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <CurrencyProvider>
          <AdminDashboardProvider>
            <BalanceProvider>
              <AdminProvider>
                <ChatProvider>
                  <Router>
                    <AnimatedRoutes />
                    <WinnerCelebration />
                    <NotificationManager />
                    </Router>
                  </ChatProvider>
                </AdminProvider>
              </BalanceProvider>
            </AdminDashboardProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
