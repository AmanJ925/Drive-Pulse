import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { AdminStats, AdminDriver } from '../types';
import { Icon, Loading } from '../components/shared';

interface AdminOverviewPageProps {
  setPage: (p: string) => void;
  setSelectedTrip: (id: string) => void;
  setAdminDriver: (id: string) => void;
}

export default function AdminOverviewPage({ setPage, setAdminDriver }: AdminOverviewPageProps) {
  const [stats,   setStats]   = useState<AdminStats | null>(null);
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<AdminStats>('/admin/stats'),
      apiFetch<AdminDriver[]>('/admin/drivers'),
    ]).then(([s, d]) => { setStats(s); setDrivers(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><Loading/></div>;

  const statCards: [string, string | number | undefined, string, string][] = [
    ['Total Drivers',    stats?.total_drivers,                 'users',   'blue'],
    ['Total Trips',      stats?.total_trips,                   'map',     'green'],
    ['Total Flags',      stats?.total_flags,                   'warning', 'amber'],
    ['Avg Stress Score', stats?.avg_stress?.toFixed(3),        'shield',  'red'],
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Admin Dashboard</div>
        <div className="page-sub">Fleet-wide performance overview</div>
      </div>

      <div className="cards-grid cards-4" style={{marginBottom:24}}>
        {statCards.map(([label, val, icon, color]) => (
          <div key={label} className="card">
            <div className="card-label"><Icon name={icon} size={12}/>{label}</div>
            <div className={`card-value c-${color}`}>{val ?? '—'}</div>
            <div className={`card-icon ${color}`}><Icon name={icon} size={16}/></div>
          </div>
        ))}
      </div>

      <div className="section-title"><Icon name="users"/>All Drivers</div>
      <div className="chart-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Driver ID</th><th>Name</th><th>City</th>
                <th>Rating</th><th>Trips</th><th>Avg Stress</th>
                <th>Total Earnings</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(d => (
                <tr key={d.driver_id} style={{cursor:'pointer'}}>
                  <td style={{fontFamily:'var(--font-mono)',color:'var(--text2)',fontSize:11}}>{d.driver_id}</td>
                  <td style={{fontFamily:'var(--font-head)',fontWeight:600}}>{d.name}</td>
                  <td style={{color:'var(--text2)'}}>{d.city}</td>
                  <td><span style={{color:'var(--amber)'}}><Icon name="star" size={11}/></span> {d.rating}</td>
                  <td>{d.total_trips}</td>
                  <td>
                    <span style={{color: d.avg_stress > 0.6 ? 'var(--red)' : d.avg_stress > 0.3 ? 'var(--amber)' : 'var(--green)'}}>
                      {(d.avg_stress || 0).toFixed(3)}
                    </span>
                  </td>
                  <td className="c-green">₹{(d.total_earnings || 0).toFixed(0)}</td>
                  <td>
                    <button
                      onClick={() => { setAdminDriver(d.driver_id); setPage('driver_detail'); }}
                      style={{background:'var(--bg3)',border:'1px solid var(--border2)',
                        color:'var(--text)',borderRadius:5,padding:'4px 10px',
                        cursor:'pointer',fontSize:11,fontFamily:'var(--font-mono)'}}>
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
