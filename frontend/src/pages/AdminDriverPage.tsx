import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Driver, Trip } from '../types';
import { Icon, Loading, QualityBadge } from '../components/shared';

interface AdminDriverPageProps {
  driverId: string;
  onBack: () => void;
  setPage: (p: string) => void;
  setSelectedTrip: (id: string) => void;
}

export default function AdminDriverPage({ driverId, onBack, setPage, setSelectedTrip }: AdminDriverPageProps) {
  const [trips,   setTrips]   = useState<Trip[]>([]);
  const [driver,  setDriver]  = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<Driver>(`/drivers/${driverId}`),
      apiFetch<Trip[]>(`/trips?driver_id=${driverId}`),
    ]).then(([d, t]) => { setDriver(d); setTrips(t); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [driverId]);

  if (loading) return <div className="page"><Loading/></div>;

  return (
    <div className="page">
      <button className="back-btn" onClick={onBack}>
        <Icon name="back" size={13}/>Back to drivers
      </button>
      <div className="page-header">
        <div className="page-title">{driver?.name}</div>
        <div className="page-sub">{driverId} · {driver?.city} · ⭐ {driver?.rating}</div>
      </div>
      <div className="section-title"><Icon name="map"/>Trip History</div>
      <div className="trip-list">
        {trips.map(t => (
          <div key={t.trip_id} className="trip-row"
            onClick={() => { setSelectedTrip(t.trip_id); setPage('trip'); }}>
            <div className="trip-route">
              {t.pickup_location}<span>→</span>{t.dropoff_location}
              {t.trip_quality_rating && (
                <span style={{marginLeft:8}}><QualityBadge q={t.trip_quality_rating}/></span>
              )}
            </div>
            <div className="trip-meta">
              <span className="trip-stat">{t.date}</span>
              <span className="trip-stat">{t.distance_km} km · ₹{t.fare}</span>
              <span className="trip-stat"><Icon name="clock" size={11}/>{t.duration_min}m</span>
              {(t.flagged_moments_count ?? 0) > 0 && (
                <span className="trip-flags">
                  <Icon name="warning" size={11}/>{t.flagged_moments_count} flags
                </span>
              )}
            </div>
            <div style={{color:'var(--text3)'}}><Icon name="arrow" size={14}/></div>
          </div>
        ))}
        {trips.length === 0 && <div className="empty-state">No trips found</div>}
      </div>
    </div>
  );
}
