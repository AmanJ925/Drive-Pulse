import { useState, FormEvent } from 'react';
import { PulseIcon } from '../components/shared';
import { apiFetch } from '../utils/api';
import { LoginResponse } from '../types';

export default function LoginPage({ onLogin }: { onLogin: (data: LoginResponse) => void }) {
  const [driverId, setDriverId] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const body = isAdmin
        ? { password, is_admin: true }
        : { driver_id: driverId, password: password || driverId, is_admin: false };
      const data = await apiFetch<LoginResponse>('/login', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      localStorage.setItem('dp_token', data.token);
      onLogin(data);
    } catch (err) {
      setError((err as Error).message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <div className="nav-logo" style={{margin:0}}>
            <div className="pulse-icon"><PulseIcon/></div>
            DrivePulse
          </div>
        </div>
        <p className="login-tagline">Driver Safety &amp; Earnings Insights</p>
        <form onSubmit={handleLogin}>
          {!isAdmin && (
            <>
              <div className="form-label">Driver ID</div>
              <input
                className="form-input"
                placeholder="e.g. DRV001"
                value={driverId}
                onChange={e => setDriverId(e.target.value.toUpperCase())}
                autoFocus
              />
            </>
          )}
          <div className="form-label">{isAdmin ? 'Admin Password' : 'Password'}</div>
          <input
            className="form-input"
            type="password"
            placeholder={isAdmin ? 'Enter admin password' : 'Same as Driver ID for demo'}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {error && <div className="form-error">{error}</div>}
          <button className="form-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <div className="login-toggle">
          {isAdmin ? (
            <>Back to <span onClick={() => { setIsAdmin(false); setError(''); }}>driver login</span></>
          ) : (
            <>Admin? <span onClick={() => { setIsAdmin(true); setError(''); }}>Sign in as admin</span></>
          )}
        </div>
        <div style={{marginTop:16,padding:'10px 12px',background:'var(--bg3)',borderRadius:6,
          fontSize:11,color:'var(--text2)',lineHeight:1.8}}>
          <strong style={{color:'var(--text)'}}>Demo:</strong><br/>
          Driver: any ID from DRV001–DRV010, password = ID<br/>
          Admin: password = admin123
        </div>
      </div>
    </div>
  );
}
