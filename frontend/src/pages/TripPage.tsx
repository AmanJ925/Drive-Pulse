import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { TripDetail } from '../types';
import { Icon, PulseIcon, Loading, SynthNotice, AccelChart, AudioChart, SeverityBadge } from '../components/shared';

interface TripPageProps {
  tripId: string;
  onBack: () => void;
}

export default function TripPage({ tripId, onBack }: TripPageProps) {
  const [trip,    setTrip]    = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<TripDetail>(`/trips/${tripId}`)
      .then(setTrip).catch(console.error)
      .finally(() => setLoading(false));
  }, [tripId]);

  if (loading) return <div className="page"><Loading/></div>;
  if (!trip)   return <div className="page"><div className="empty-state">Trip not found</div></div>;

  const qualityColor: Record<string, string> = {
    excellent: 'var(--green)', good: 'var(--green)', fair: 'var(--amber)', poor: 'var(--red)', high_stress: '#ff1744',
  };
  const dataGaps = trip.accelerometer?.filter((_, i, arr) =>
    i > 0 && (arr[i].elapsed_seconds - arr[i-1].elapsed_seconds) > 60
  ).length || 0;

  const genExplanation = () => {
    const q    = trip.trip_quality_rating || 'fair';
    const fl   = trip.flagged_moments_count || 0;
    const ms   = trip.max_severity || 'low';
    const gaps = dataGaps;
    if (q === 'excellent') return `This trip was rated Excellent — smooth driving with no significant stress events detected. ${gaps > 0 ? `${gaps} network gaps limited real-time monitoring.` : 'All sensor data was captured cleanly.'}`;
    if (q === 'poor') return `This trip was rated Poor — ${fl} flagged event${fl!==1?'s':''} including ${ms === 'high' ? '1 high-risk moment suggest' : 'multiple medium-risk events suggesting'} aggressive driving or a stressful ride. Multiple acceleration spikes exceeded the safety threshold${gaps > 0 ? `, and ${gaps} network gaps limited real-time monitoring.` : '.'}`;
    return `This trip was rated Fair — ${fl} flagged event${fl!==1?'s':''} detected. ${ms === 'medium' ? 'Some elevated sensor readings were recorded.' : 'Minor sensor events were noted.'} ${gaps > 0 ? `${gaps} network gaps affected monitoring coverage.` : ''}`;
  };

  return (
    <div className="page">
      <button className="back-btn" onClick={onBack}>
        <Icon name="back" size={13}/>Back to dashboard
      </button>

      <div className="trip-detail-header">
        <div className="trip-route-big">
          {trip.pickup_location} <span style={{color:'var(--text2)',fontWeight:400}}>→</span> {trip.dropoff_location}
        </div>
        <div className="trip-detail-meta">
          <span className="trip-detail-stat" style={{color:'var(--text)',fontFamily:'var(--font-mono)',fontSize:11}}>
            {trip.trip_id}
          </span>
          <span className="trip-detail-stat">{trip.distance_km} km · ₹{trip.fare}</span>
        </div>
      </div>

      <div className="cards-grid cards-4" style={{marginBottom:16}}>
        <div className="card">
          <div className="card-label">Quality</div>
          <div className="card-value" style={{fontSize:22,color:qualityColor[trip.trip_quality_rating || ''] || 'var(--text)'}}>
            {trip.trip_quality_rating
              ? trip.trip_quality_rating.charAt(0).toUpperCase() + trip.trip_quality_rating.slice(1)
              : '—'}
          </div>
        </div>
        <div className="card">
          <div className="card-label">Safety Score</div>
          <div className="card-value" style={{color: (trip.safety_score ?? 100) >= 70 ? 'var(--green)' : (trip.safety_score ?? 100) >= 40 ? 'var(--amber)' : 'var(--red)'}}>
            {trip.safety_score ?? Math.round((1 - (trip.stress_score || 0)) * 100)}
          </div>
          <div className="card-sub" style={{fontSize:10,color:'var(--text3)'}}>
            Stress: {((trip.stress_score || 0) * 100).toFixed(0)}%
          </div>
        </div>
        <div className="card">
          <div className="card-label">Flags</div>
          <div className={`card-value ${(trip.flagged_moments_count ?? 0) > 0 ? 'c-amber' : 'c-green'}`}>
            {trip.flagged_moments_count ?? 0}
          </div>
        </div>
        <div className="card">
          <div className="card-label">Data Gaps</div>
          <div className={`card-value ${dataGaps > 0 ? 'c-amber' : 'c-green'}`}>{dataGaps}</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <div className="chart-title"><PulseIcon/>Acceleration Timeline</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {trip.sensor_synthesized && <SynthNotice/>}
            {dataGaps > 0 && <span className="chart-badge">Gaps detected</span>}
          </div>
        </div>
        <AccelChart data={trip.accelerometer} flags={trip.flags} durationSec={trip.duration_sec}/>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <div className="chart-title">🔊 Audio Intensity</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {trip.sensor_synthesized && <SynthNotice/>}
            {dataGaps > 0 && <span className="chart-badge">Gaps detected</span>}
          </div>
        </div>
        <AudioChart data={trip.audio} flags={trip.flags} durationSec={trip.duration_sec}/>
      </div>

      {trip.flags?.length > 0 && (
        <div className="chart-card">
          <div className="section-title"><Icon name="warning"/>Flagged Events</div>
          <div className="flag-list">
            {trip.flags.map(f => (
              <div key={f.flag_id} className={`flag-item ${f.severity}`}>
                <div className="flag-title">
                  {f.explanation?.split('.')[0] || f.flag_type?.replace(/_/g,' ')}
                  <SeverityBadge s={f.severity}/>
                </div>
                <div className="flag-meta">
                  <span>@ {f.elapsed_seconds}s</span>
                  {f.motion_score > 0 && <span>Accel: {parseFloat(String(f.motion_score)).toFixed(2)}g</span>}
                  {f.audio_score  > 0 && <span>Audio score: {parseFloat(String(f.audio_score)).toFixed(2)}</span>}
                  <span style={{textTransform:'capitalize'}}>{f.flag_type?.replace(/_/g,' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="quality-box">
        <div className="quality-box-title"><Icon name="shield"/>Trip Quality Summary</div>
        <p>{genExplanation()}</p>
      </div>
    </div>
  );
}
