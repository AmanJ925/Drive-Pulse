import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { AdminStats, AdminDriver, Trip } from '../types';
import { Icon, Loading, QualityBadge } from '../components/shared';

interface AdminOverviewPageProps {
  setPage: (p: string) => void;
  setSelectedTrip: (id: string) => void;
  setAdminDriver: (id: string) => void;
}

export default function AdminOverviewPage({ setPage, setSelectedTrip }: AdminOverviewPageProps) {
  const [stats,        setStats]        = useState<AdminStats | null>(null);
  const [drivers,      setDrivers]      = useState<AdminDriver[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [driverTrips,  setDriverTrips]  = useState<Record<string, Trip[]>>({});
  const [tripsLoading, setTripsLoading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<AdminStats>('/admin/stats'),
      apiFetch<AdminDriver[]>('/admin/drivers'),
    ]).then(([s, d]) => { setStats(s); setDrivers(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function toggleDriver(driverId: string) {
    if (expandedId === driverId) { setExpandedId(null); return; }
    setExpandedId(driverId);
    if (driverTrips[driverId]) return;
    setTripsLoading(driverId);
    apiFetch<Trip[]>(`/trips?driver_id=${driverId}`)
      .then(trips => setDriverTrips(prev => ({ ...prev, [driverId]: trips })))
      .catch(console.error)
      .finally(() => setTripsLoading(null));
  }

  if (loading) return <div className="page"><Loading/></div>;

  const statCards: [string, string | number | undefined, string, string][] = [
    ['Total Drivers',    stats?.total_drivers,          'users',   'blue'],
    ['Total Trips',      stats?.total_trips,            'map',     'green'],
    ['Total Flags',      stats?.total_flags,            'warning', 'amber'],
    ['Avg Stress Score', stats?.avg_stress?.toFixed(3), 'shield',  'red'],
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
      <div className="chart-card" style={{padding:0, overflow:'hidden'}}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Driver ID</th><th>Name</th><th>City</th>
                <th>Rating</th><th>Trips</th><th>Avg Stress</th>
                <th>Total Earnings</th><th></th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(d => (
                <>
                  <tr key={d.driver_id}>
                    <td style={{fontFamily:'var(--font-mono)',color:'var(--text2)',fontSize:11}}>
                      {d.driver_id}
                    </td>
                    <td style={{fontFamily:'var(--font-head)',fontWeight:600}}>{d.name}</td>
                    <td style={{color:'var(--text2)'}}>{d.city}</td>
                    <td>
                      <span style={{color:'var(--amber)'}}><Icon name="star" size={11}/></span> {d.rating}
                    </td>
                    <td>{d.total_trips}</td>
                    <td>
                      <span style={{color: d.avg_stress > 0.6 ? 'var(--red)' : d.avg_stress > 0.3 ? 'var(--amber)' : 'var(--green)'}}>
                        {(d.avg_stress || 0).toFixed(3)}
                      </span>
                    </td>
                    <td className="c-green">₹{(d.total_earnings || 0).toFixed(0)}</td>
                    <td>
                      <button
                        onClick={() => toggleDriver(d.driver_id)}
                        style={{
                          background: expandedId === d.driver_id ? 'rgba(64,196,255,0.1)' : 'var(--bg3)',
                          border: `1px solid ${expandedId === d.driver_id ? 'rgba(64,196,255,0.3)' : 'var(--border2)'}`,
                          color: expandedId === d.driver_id ? 'var(--blue)' : 'var(--text)',
                          borderRadius:5, padding:'4px 10px', cursor:'pointer',
                          fontSize:11, fontFamily:'var(--font-mono)', transition:'all 0.15s',
                        }}>
                        {expandedId === d.driver_id ? 'Hide ↑' : 'View ↓'}
                      </button>
                    </td>
                  </tr>

                  {expandedId === d.driver_id && (
                    <tr key={`${d.driver_id}-expand`}>
                      <td colSpan={8} style={{padding:0, background:'var(--bg)'}}>
                        <div style={{
                          padding:'12px 20px 16px',
                          borderTop:'1px solid var(--border)',
                          borderBottom:'1px solid var(--border)',
                        }}>
                          {/* Driver mini-header */}
                          <div style={{display:'flex', alignItems:'center', gap:12,
                            marginBottom:14, paddingBottom:10, borderBottom:'1px solid var(--border)'}}>
                            <div style={{
                              width:32, height:32, borderRadius:'50%',
                              background:'linear-gradient(135deg,var(--green),var(--blue))',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:12, fontWeight:700, color:'#000', fontFamily:'var(--font-head)',
                            }}>
                              {d.name.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                            </div>
                            <div>
                              <div style={{fontFamily:'var(--font-head)', fontWeight:700, fontSize:14}}>
                                {d.name}
                              </div>
                              <div style={{fontSize:11, color:'var(--text2)'}}>
                                {d.driver_id} · {d.city} · ⭐ {d.rating}
                              </div>
                            </div>
                          </div>

                          {/* Trip list */}
                          {tripsLoading === d.driver_id ? (
                            <div style={{padding:'20px 0', display:'flex', alignItems:'center',
                              gap:10, color:'var(--text3)', fontSize:12}}>
                              <div className="spinner" style={{width:14, height:14}}/>Loading trips…
                            </div>
                          ) : (driverTrips[d.driver_id] || []).length === 0 ? (
                            <div className="empty-state" style={{padding:'20px 0'}}>No trips found</div>
                          ) : (
                            <div className="trip-list">
                              {(driverTrips[d.driver_id] || []).map(t => (
                                <div key={t.trip_id} className="trip-row"
                                  onClick={() => { setSelectedTrip(t.trip_id); setPage('trip'); }}>
                                  <div className="trip-route">
                                    {t.pickup_location}<span>→</span>{t.dropoff_location}
                                    {t.trip_quality_rating && (
                                      <span style={{marginLeft:8}}>
                                        <QualityBadge q={t.trip_quality_rating}/>
                                      </span>
                                    )}
                                  </div>
                                  <div className="trip-meta">
                                    <span className="trip-stat">{t.date}</span>
                                    <span className="trip-stat">
                                      <Icon name="map" size={11}/>{t.distance_km} km
                                    </span>
                                    <span className="trip-stat">₹{t.fare}</span>
                                    <span className="trip-stat">
                                      <Icon name="clock" size={11}/>{t.duration_min}m
                                    </span>
                                    {(t.flagged_moments_count ?? 0) > 0 && (
                                      <span className="trip-flags">
                                        <Icon name="warning" size={11}/>{t.flagged_moments_count} flags
                                      </span>
                                    )}
                                  </div>
                                  <div style={{color:'var(--text3)'}}>
                                    <Icon name="arrow" size={14}/>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}