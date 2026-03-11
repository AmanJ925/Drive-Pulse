import { useState, useEffect, useRef } from 'react';
import { AuthUser, Driver, LoginResponse, WSAlert } from './types';
import { apiFetch, WS_URL } from './utils/api';
import Nav from './components/Nav';
import { AlertToast } from './components/shared';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EarningsPage from './pages/EarningsPage';
import TripPage from './pages/TripPage';
import AdminOverviewPage from './pages/AdminOverviewPage';
import AdminDriverPage from './pages/AdminDriverPage';

export default function App() {
  const [user,         setUser]         = useState<AuthUser | null>(null);
  const [driver,       setDriver]       = useState<Driver | null>(null);
  const [page,         setPage]         = useState('dashboard');
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [adminDriver,  setAdminDriver]  = useState<string | null>(null);
  const [alerts,       setAlerts]       = useState<WSAlert[]>([]);
  const [authChecked,  setAuthChecked]  = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Auto-login from stored token — validate with backend first
  useEffect(() => {
    const token = localStorage.getItem('dp_token');
    if (!token) { setAuthChecked(true); return; }

    let payload: AuthUser;
    try {
      payload = JSON.parse(atob(token.split('.')[0])) as AuthUser;
    } catch (_) {
      localStorage.removeItem('dp_token');
      setAuthChecked(true);
      return;
    }

    // Check expiry locally before hitting the API
    const exp = (payload as AuthUser & { exp?: number }).exp;
    if (exp && exp * 1000 < Date.now()) {
      localStorage.removeItem('dp_token');
      setAuthChecked(true);
      return;
    }

    // Validate with backend — 401 clears token and shows login
    if (payload.role === 'driver') {
      apiFetch<Driver>(`/drivers/${payload.sub}`)
        .then(driver => {
          setUser(payload);
          setDriver(driver);
          setPage('dashboard');
          connectWS(payload.sub, token);
        })
        .catch(() => {
          localStorage.removeItem('dp_token');
        })
        .finally(() => setAuthChecked(true));
    } else {
      apiFetch<unknown>('/admin/stats')
        .then(() => {
          setUser(payload);
          setPage('overview');
        })
        .catch(() => {
          localStorage.removeItem('dp_token');
        })
        .finally(() => setAuthChecked(true));
    }
  }, []);

  function handleLogin(data: LoginResponse) {
    const payload = JSON.parse(atob(data.token.split('.')[0])) as AuthUser;
    setUser(payload);
    setAuthChecked(true);
    if (data.driver) {
      setDriver(data.driver);
      setPage('dashboard');
      connectWS(payload.sub, data.token);
    } else {
      setPage('overview');
    }
  }

  function connectWS(driverId: string, token: string) {
    try {
      const ws = new WebSocket(WS_URL);
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'auth', token }));
        ws.send(JSON.stringify({ type: 'ping' }));
      };
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'alert') {
          const stamped = { ...msg, id: Date.now() } as WSAlert;
          setAlerts(prev => [...prev.slice(-4), stamped]);
          setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== stamped.id)), 8000);
        }
      };
      wsRef.current = ws;
    } catch (_) {}
  }

  function handleLogout() {
    localStorage.removeItem('dp_token');
    if (wsRef.current) wsRef.current.close();
    setUser(null); setDriver(null);
    setPage('dashboard'); setAlerts([]);
  }

  // Don't render until token check is done — prevents flash of wrong UI
  if (!authChecked && !user) return null;
  if (!user) return <LoginPage onLogin={handleLogin}/>;

  const isAdmin  = user.role === 'admin';
  const driverId = user.sub;

  const renderPage = () => {
    if (page === 'trip' && selectedTrip) {
      return (
        <TripPage
          tripId={selectedTrip}
          onBack={() => setPage(isAdmin ? 'driver_detail' : 'dashboard')}
        />
      );
    }
    if (page === 'driver_detail' && adminDriver) {
      return (
        <AdminDriverPage
          driverId={adminDriver}
          onBack={() => setPage('overview')}
          setPage={setPage}
          setSelectedTrip={setSelectedTrip}
        />
      );
    }
    if (isAdmin) {
      return (
        <AdminOverviewPage
          setPage={setPage}
          setSelectedTrip={setSelectedTrip}
          setAdminDriver={setAdminDriver}
        />
      );
    }
    if (page === 'earnings') return <EarningsPage driverId={driverId}/>;
    return (
      <DashboardPage
        driverId={driverId}
        setPage={setPage}
        setSelectedTrip={setSelectedTrip}
      />
    );
  };

  return (
    <div className="layout">
      <Nav page={page} setPage={setPage} user={user} driver={driver} onLogout={handleLogout}/>
      {renderPage()}
      <AlertToast alerts={alerts} onDismiss={(id) => setAlerts(prev => prev.filter(a => a.id !== id))}/>
    </div>
  );
}