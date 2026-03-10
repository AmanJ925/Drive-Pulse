import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { EarningsData } from '../types';
import { Icon, Loading, StatusBadge, EarningsProgressChart, VelocityChart } from '../components/shared';

export default function EarningsPage({ driverId }: { driverId: string }) {
  const [data,    setData]    = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<EarningsData>(`/earnings/${driverId}`)
      .then(setData).catch(console.error)
      .finally(() => setLoading(false));
  }, [driverId]);

  if (loading) return <div className="page"><Loading/></div>;
  if (!data)   return <div className="page"><div className="empty-state">No earnings data found</div></div>;

  const { goal, velocity_log, predicted_end_earnings, on_track, gap_to_goal } = data;
  const targetVel = goal ? goal.target_earnings / goal.target_hours : 175;
  const forecast  = on_track
    ? (gap_to_goal > 100 ? 'ahead' : 'on_track')
    : (Math.abs(gap_to_goal) > 200 ? 'behind' : 'at_risk');

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Earnings Progress</div>
        <div className="page-sub">Track your daily earnings performance</div>
      </div>

      <div className="cards-grid cards-4">
        <div className="card">
          <div className="card-label"><Icon name="dollar" size={12}/>Current Earnings</div>
          <div className="card-value c-green">₹{(data.current_earnings || 0).toFixed(0)}</div>
          <div className="card-icon green"><Icon name="dollar" size={16}/></div>
        </div>
        <div className="card">
          <div className="card-label"><Icon name="star" size={12}/>Daily Goal</div>
          <div className="card-value">₹{(goal?.target_earnings || 0).toFixed(0)}</div>
          <div className="card-sub">{goal?.target_hours}h shift</div>
          <div className="card-icon amber"><Icon name="star" size={16}/></div>
        </div>
        <div className="card">
          <div className="card-label"><Icon name="trend" size={12}/>Predicted End</div>
          <div className={`card-value ${on_track ? 'c-green' : 'c-red'}`}>
            ₹{predicted_end_earnings?.toFixed(0)}
          </div>
          <div className="card-sub">{gap_to_goal >= 0 ? '▲' : '▼'} ₹{Math.abs(gap_to_goal).toFixed(0)} vs goal</div>
          <div className="card-icon blue"><Icon name="trend" size={16}/></div>
        </div>
        <div className="card">
          <div className="card-label">Status</div>
          <div style={{marginTop:8}}><StatusBadge status={forecast}/></div>
          <div className="card-sub" style={{marginTop:8}}>
            ₹{velocity_log.at(-1)?.current_velocity?.toFixed(0) || 0}/hr earned
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <div className="chart-title">📈 Cumulative Earnings vs Goal</div>
          <StatusBadge status={forecast}/>
        </div>
        <EarningsProgressChart velocityLog={velocity_log} goal={goal}/>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <div className="chart-title">⚡ Earnings Velocity (₹/hr)</div>
          <span className="chart-badge">Target ₹{targetVel.toFixed(0)}/hr</span>
        </div>
        <VelocityChart velocityLog={velocity_log} targetVelocity={targetVel}/>
      </div>
    </div>
  );
}
