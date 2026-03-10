import { AuthUser, Driver } from '../types';
import { PulseIcon, Icon } from './shared';

interface NavProps {
  page: string;
  setPage: (p: string) => void;
  user: AuthUser;
  driver: Driver | null;
  onLogout: () => void;
}

export default function Nav({ page, setPage, user, driver, onLogout }: NavProps) {
  const isAdmin = user?.role === 'admin';
  const initials = driver?.name
    ? driver.name.split(' ').map(n => n[0]).join('').slice(0, 2)
    : 'AD';
  const navItems: [string, string][] = isAdmin
    ? [['overview', 'Overview'], ['drivers', 'Drivers']]
    : [['dashboard', 'Dashboard'], ['earnings', 'Earnings']];

  return (
    <nav>
      <div className="nav-logo">
        <div className="pulse-icon"><PulseIcon/></div>
        DrivePulse
      </div>
      {navItems.map(([key, label]) => (
        <button
          key={key}
          className={`nav-link ${page === key ? 'active' : ''}`}
          onClick={() => setPage(key)}
        >
          {label}
        </button>
      ))}
      <div className="nav-spacer"/>
      <div className="nav-user">
        <div>
          <div className="nav-user-name">{driver?.name || 'Admin'}</div>
          <div className="nav-user-id">{user?.sub}</div>
        </div>
        <div className="avatar">{initials}</div>
        <button
          onClick={onLogout}
          style={{background:'none',border:'none',color:'var(--text2)',cursor:'pointer',padding:4,display:'flex'}}
        >
          <Icon name="logout" size={14}/>
        </button>
      </div>
    </nav>
  );
}
