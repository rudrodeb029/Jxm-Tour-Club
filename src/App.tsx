import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Wallet from './pages/Wallet';
import MyBets from './pages/MyBets';
import MatchDetails from './pages/MatchDetails';
import Profile from './pages/Profile';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Support from './pages/Support';
import { ChatProvider } from './context/ChatContext';
import LiveChat from './components/LiveChat';
import WinnerCelebration from './components/WinnerCelebration';

import { BalanceProvider } from './context/BalanceContext';
import { AdminProvider } from './context/AdminContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AdminDashboardProvider } from './context/AdminDashboardContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { AuthProvider } from './context/AuthContext';

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
                    <Routes>
                      <Route path="/" element={<Splash />} />
                      <Route path="/onboarding" element={<Onboarding />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/home" element={<Home />} />
                      <Route path="/wallet" element={<Wallet />} />
                      <Route path="/my-bets" element={<MyBets />} />
                      <Route path="/match/:id" element={<MatchDetails />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/admin" element={<AdminLogin />} />
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/support" element={<Support />} />
                      </Routes>
                      <LiveChat />
                      <WinnerCelebration />
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
