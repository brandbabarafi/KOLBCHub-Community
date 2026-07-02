import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import MobileLayout from './components/MobileLayout';

import Home from './pages/Home';
import Campaigns from './pages/Campaigns';
import MyCampaign from './pages/MyCampaign';
import Vouchers from './pages/Vouchers';
import Payments from './pages/Payments';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MobileLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/my-campaign" element={<Navigate to="/campaigns" replace />} />
              <Route path="/voucher" element={<Vouchers />} />
              <Route path="/payment" element={<Payments />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
