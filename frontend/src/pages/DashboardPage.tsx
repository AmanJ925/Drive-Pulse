import { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { apiFetch } from '../utils/api';
import { DashboardData } from '../types';
import { Icon, Loading, QualityBadge } from '../components/shared';

Chart.register(...registerables);

interface DashboardPageProps {
  driverId: string;
  setPage: (p: string) => void;
  setSelectedTrip: (id: string) => void;
}

export default function DashboardPage({ driverId, setPage, setSelectedTrip }: DashboardPageProps) {
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<DashboardData>(`/dashboard/${driverId}`)
      .then(setData).catch(console.error)
      .finally(() => setLoading(false));
  }, [driverId]);

  if (loading) return <div className="page"><Loading/></div>;
  if (!data)   return <div className="page"><div className="empty-state">No data found</div></div>;

  const statusColors: Record<string, string> = { ahead: 'green', on_track: 'blue', behind: 'red' };
  const statusLabels: Record<string, string> = {
    ahead: 'Ahead of Goal', on_track: 'On Track', behind: 'Behind Goal',
  };
  const vel = data.current_velocity;
  const req = data.required_velocity;
  const st  = data.status || 'on_track';

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">
          Welcome back, {data?.goal?.driver_id?.replace('DRV', 'Driver #')}
        </div>
        <div className="page-sub">Here's your shift overview</div>
      </div>

      <div className="cards-grid cards-4">
        <div className="card">
          <div className="card-label"><Icon name="dollar" size={12}/>Today's Earnings</div>
          <div className="card-value c-green">₹{(data.today_earnings || 0).toFixed(0)}</div>
          <div className="card-sub">Current shift total</div>
          <div className="card-icon green"><Icon name="dollar" size={16}/></div>
        </div>
        <div className="card">
          <div className="card-label"><Icon name="trend" size={12}/>Status</div>
          <div className={`card-value c-${statusColors[st] || 'blue'}`} style={{fontSize:20,marginTop:4}}>
            {statusLabels[st] || st}
          </div>
          <div className="card-sub">₹{vel.toFixed(0)}/hr · Need ₹{req.toFixed(0)}/hr</div>
          <div className={`card-icon ${statusColors[st] || 'blue'}`}><Icon name="trend" size={16}/></div>
        </div>
        <div className="card">
          <div className="card-label"><Icon name="map" size={12}/>Trips Completed</div>
          <div className="card-value">{data.trips_completed}</div>
          <div className="card-sub">Today's rides</div>
          <div className="card-icon blue"><Icon name="map" size={16}/></div>
        </div>
        <div className="card">
          <div className="card-label"><Icon name="warning" size={12}/>Flagged Events</div>
          <div className={`card-value ${data.flagged_events > 0 ? 'c-amber' : 'c-green'}`}>
            {data.flagged_events}
          </div>
          <div className="card-sub">Across all trips today</div>
          <div className={`card-icon ${data.flagged_events > 0 ? 'amber' : 'green'}`}>
            <Icon name="warning" size={16}/>
          </div>
        </div>
      </div>

      {/* Hours Elapsed Bar */}
      {(() => {
        const target  = data.goal?.target_hours  || 8;
        const elapsed = data.goal?.current_hours || 0;
        const pct     = Math.min((elapsed / target) * 100, 100);
        const remaining = Math.max(target - elapsed, 0);
        const hFmt = (h: number) => {
          const hh = Math.floor(h);
          const mm = Math.round((h - hh) * 60);
          return mm > 0 ? `${hh}h ${mm}m` : `${hh}h`;
        };
        const barColor = pct >= 75 ?  'var(--green)' : 'var(--blue)';
        return (
          <div className="hours-bar-card">
            <div className="hours-bar-header">
              <div className="hours-bar-label">
                <Icon name="clock" size={12}/>
                Hours Elapsed Today
              </div>
              <div className="hours-bar-stats">
                <span style={{color: barColor, fontFamily:'var(--font-head)', fontWeight:700}}>
                  {hFmt(elapsed)}
                </span>
                <span style={{color:'var(--text3)'}}>/ {hFmt(target)}</span>
                {remaining > 0
                  ? <span className="hours-bar-remaining">{hFmt(remaining)} remaining</span>
                  : <span className="hours-bar-done">Shift complete</span>
                }
              </div>
            </div>
            <div className="hours-bar-track">
              <div className="hours-bar-fill" style={{width: `${pct}%`, background: barColor}}/>
            </div>
          </div>
        );
      })()}

      {/* Live Monitor */}
      <LiveMonitor/>

      {/* Today's Trips */}
      <div className="section-title"><Icon name="map"/>Today's Trips</div>
      <div className="trip-list">
        {data.trips?.length === 0 && <div className="empty-state">No trips today</div>}
        {data.trips?.map(t => (
          <div key={t.trip_id} className="trip-row"
            onClick={() => { setSelectedTrip(t.trip_id); setPage('trip'); }}>
            <div className="trip-route">
              {t.pickup_location}<span>→</span>{t.dropoff_location}
              {t.trip_quality_rating && (
                <span style={{marginLeft:8}}><QualityBadge q={t.trip_quality_rating}/></span>
              )}
            </div>
            <div className="trip-meta">
              <span className="trip-stat"><Icon name="map" size={11}/>{t.distance_km?.toFixed(1)} km</span>
              <span className="trip-stat">₹{t.fare?.toFixed(0)}</span>
              <span className="trip-stat"><Icon name="clock" size={11}/>{t.duration_min?.toFixed(0)}m</span>
              {(t.flagged_moments_count ?? 0) > 0 && (
                <span className="trip-flags">
                  <Icon name="warning" size={11}/>{t.flagged_moments_count} flags
                </span>
              )}
            </div>
            <div style={{color:'var(--text3)'}}><Icon name="arrow" size={14}/></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Deterministic pseudo-random (seeded, not Date.now-based) ────────────────
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── Live Accel Chart (Chart.js, matches trip detail style) ──────────────────
function LiveAccelChart({ points, alerts }: {
  points: { x: number; y: number }[];
  alerts: { x: number; y: number; color: string }[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

  // Build chart once on mount
  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'scatter',
      data: {
        datasets: [
          {
            type: 'line', label: 'Signal',
            data: [],
            borderColor: '#40c4ff', borderWidth: 1.5,
            fill: true, backgroundColor: 'rgba(64,196,255,0.06)',
            tension: 0.35, pointRadius: 0, order: 2,
          },
          {
            type: 'line', label: 'Threshold',
            data: [],
            borderColor: 'rgba(255,82,82,0.55)', borderWidth: 1,
            borderDash: [5, 4], pointRadius: 0, fill: false, order: 3,
          },
          {
            type: 'scatter', label: 'Alert',
            data: [],
            pointBackgroundColor: [],
            pointBorderColor: [],
            pointRadius: 7, order: 1,
          },
        ],
      },
      options: {
        animation: false,
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a1a', borderColor: '#333', borderWidth: 1,
            titleColor: '#999', bodyColor: '#f0f0f0',
            callbacks: {
              title: items => `t = ${Math.round(items[0].parsed.x)}s`,
              label: item => {
                if (item.datasetIndex === 0) return `Magnitude: ${item.parsed.y.toFixed(3)}g`;
                if (item.datasetIndex === 2) return `⚠ Alert at ${Math.round(item.parsed.x)}s`;
                return null;
              },
            },
          },
        },
        scales: {
          x: {
            type: 'linear', min: 0, max: 60,
            grid: { color: '#1a1a1a' },
            ticks: { color: '#666', font: { family: 'DM Mono', size: 10 }, maxTicksLimit: 8, callback: (v: number) => `${v}s` },
          },
          y: {
            min: 0, max: 1.5,
            grid: { color: '#1a1a1a' },
            ticks: { color: '#666', font: { family: 'DM Mono', size: 10 }, callback: (v: number) => `${v}g` },
          },
        },
      },
    });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, []);

  // Push new data without full re-render
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !points.length) return;

    const windowSec = 60;
    const latest = points[points.length - 1].x;
    const xMin   = Math.max(0, latest - windowSec);
    const xMax   = Math.max(xMin + windowSec, latest + 2);

    // Update signal line
    chart.data.datasets[0].data = points;
    // Scrolling threshold line
    chart.data.datasets[1].data = [{ x: xMin, y: 0.5 }, { x: xMax, y: 0.5 }];
    // Alert scatter
    chart.data.datasets[2].data = alerts.map(a => ({ x: a.x, y: a.y }));
    (chart.data.datasets[2] as any).pointBackgroundColor = alerts.map(a => a.color);
    (chart.data.datasets[2] as any).pointBorderColor     = alerts.map(a => a.color);

    // Scroll x-axis window
    chart.options.scales!.x!.min = xMin;
    chart.options.scales!.x!.max = xMax;

    chart.update('none');
  }, [points, alerts]);

  return (
    <div>
      <div className="chart-wrap"><canvas ref={canvasRef}/></div>
      <div className="legend-row">
        <div className="legend-item"><div className="legend-line" style={{background:'#40c4ff'}}/> Signal</div>
        <div className="legend-item"><div className="legend-line" style={{background:'rgba(255,82,82,0.55)',height:1}}/> Threshold (0.5g)</div>
        <div className="legend-item"><div className="legend-dot" style={{background:'#ff5252'}}/> High Risk</div>
        <div className="legend-item"><div className="legend-dot" style={{background:'#ffab40'}}/> Medium Risk</div>
      </div>
    </div>
  );
}

// ─── Live Audio Chart (Chart.js, matches trip detail style) ──────────────────
function LiveAudioChart({ points, alerts }: {
  points: { x: number; y: number }[];
  alerts: { x: number; y: number; color: string }[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'scatter',
      data: {
        datasets: [
          {
            type: 'line', label: 'Signal',
            data: [],
            borderColor: '#ce93d8', borderWidth: 1.5,
            fill: true, backgroundColor: 'rgba(206,147,216,0.06)',
            tension: 0.35, pointRadius: 0, order: 2,
          },
          {
            type: 'line', label: 'Threshold',
            data: [],
            borderColor: 'rgba(255,82,82,0.55)', borderWidth: 1,
            borderDash: [5, 4], pointRadius: 0, fill: false, order: 3,
          },
          {
            type: 'scatter', label: 'Alert',
            data: [],
            pointBackgroundColor: [],
            pointBorderColor: [],
            pointRadius: 7, order: 1,
          },
        ],
      },
      options: {
        animation: false,
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a1a', borderColor: '#333', borderWidth: 1,
            callbacks: {
              title: items => `t = ${Math.round(items[0].parsed.x)}s`,
              label: item => {
                if (item.datasetIndex === 0) return `Audio: ${item.parsed.y.toFixed(1)} dB`;
                if (item.datasetIndex === 2) return `⚠ Alert at ${Math.round(item.parsed.x)}s`;
                return null;
              },
            },
          },
        },
        scales: {
          x: {
            type: 'linear', min: 0, max: 60,
            grid: { color: '#1a1a1a' },
            ticks: { color: '#666', font: { family: 'DM Mono', size: 10 }, maxTicksLimit: 8, callback: (v: number) => `${v}s` },
          },
          y: {
            min: 0, max: 110,
            grid: { color: '#1a1a1a' },
            ticks: { color: '#666', font: { family: 'DM Mono', size: 10 }, callback: (v: number) => `${v} dB` },
          },
        },
      },
    });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !points.length) return;

    const windowSec = 60;
    const latest = points[points.length - 1].x;
    const xMin   = Math.max(0, latest - windowSec);
    const xMax   = Math.max(xMin + windowSec, latest + 2);

    chart.data.datasets[0].data = points;
    chart.data.datasets[1].data = [{ x: xMin, y: 70 }, { x: xMax, y: 70 }];
    chart.data.datasets[2].data = alerts.map(a => ({ x: a.x, y: a.y }));
    (chart.data.datasets[2] as any).pointBackgroundColor = alerts.map(a => a.color);
    (chart.data.datasets[2] as any).pointBorderColor     = alerts.map(a => a.color);

    chart.options.scales!.x!.min = xMin;
    chart.options.scales!.x!.max = xMax;

    chart.update('none');
  }, [points, alerts]);

  return (
    <div>
      <div className="chart-wrap"><canvas ref={canvasRef}/></div>
      <div className="legend-row">
        <div className="legend-item"><div className="legend-line" style={{background:'#ce93d8'}}/> Signal</div>
        <div className="legend-item"><div className="legend-line" style={{background:'rgba(255,82,82,0.55)',height:1}}/> Threshold (70 dB)</div>
        <div className="legend-item"><div className="legend-dot" style={{background:'#ff5252'}}/> High Risk</div>
        <div className="legend-item"><div className="legend-dot" style={{background:'#ffab40'}}/> Medium Risk</div>
      </div>
    </div>
  );
}

// ─── Live Monitor Demo Component ─────────────────────────────────────────────
function LiveMonitor() {
  const [active,      setActive]      = useState(false);
  const [elapsed,     setElapsed]     = useState(0);
  const [earnings,    setEarnings]    = useState(0);
  const [lastAlert,   setLastAlert]   = useState<{msg:string;sev:string}|null>(null);

  // Typed as {x,y} for Chart.js scatter/line
  const [accelPts,    setAccelPts]    = useState<{x:number;y:number}[]>([]);
  const [audioPts,    setAudioPts]    = useState<{x:number;y:number}[]>([]);
  const [accelAlerts, setAccelAlerts] = useState<{x:number;y:number;color:string}[]>([]);
  const [audioAlerts, setAudioAlerts] = useState<{x:number;y:number;color:string}[]>([]);

  // Latest readings for the live value display
  const [lastMag,     setLastMag]     = useState(0);
  const [lastDb,      setLastDb]      = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const tickRef     = useRef(0);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    // Fresh seeded rng per session start
    const rng = seededRng(Date.now() & 0xffffff);

    intervalRef.current = setInterval(() => {
      tickRef.current += 1;
      const t = tickRef.current; // elapsed seconds

      setElapsed(t);
      setEarnings(e => e + (2.5 + rng() * 2));

      // ── Motion: normal baseline, spikes every ~18s and ~31s ──
      let mag = 0.05 + rng() * 0.22;
      let isHarsh = false;
      if (t % 31 === 0) { mag = 0.85 + rng() * 0.45; isHarsh = true; }
      else if (t % 18 === 0) { mag = 0.55 + rng() * 0.30; isHarsh = true; }
      mag = Math.min(mag, 1.4);
      setLastMag(mag);

      // ── Audio: baseline 38–60 dB, spikes sync with motion ──
      let db = 38 + rng() * 22;
      let isLoud = false;
      if (t % 31 === 0) { db = 88 + rng() * 12; isLoud = true; }
      else if (t % 18 === 0) { db = 74 + rng() * 10; }
      db = Math.min(db, 108);
      setLastDb(db);

      setAccelPts(prev => [...prev, { x: t, y: +mag.toFixed(4) }]);
      setAudioPts(prev => [...prev, { x: t, y: +db.toFixed(2) }]);

      // ── Alerts (only on harsh events) ──
      if (isHarsh) {
        const color = isLoud ? '#ff5252' : '#ffab40';
        const sev   = isLoud ? 'high' : 'medium';
        setAccelAlerts(prev => [...prev, { x: t, y: +mag.toFixed(4), color }]);
        setAudioAlerts(prev => [...prev, { x: t, y: +db.toFixed(2), color }]);
        setLastAlert({ msg: isLoud ? '⚠ Hard braking + loud cabin noise' : '⚠ Hard braking detected', sev });
        setTimeout(() => setLastAlert(null), 5000);
      }
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active]);

  function handleStop() {
    setActive(false);
    setElapsed(0); setEarnings(0); setLastAlert(null);
    setAccelPts([]); setAudioPts([]);
    setAccelAlerts([]); setAudioAlerts([]);
    setLastMag(0); setLastDb(0);
    tickRef.current = 0;
  }

  const fmtTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  const magColor = lastMag > 0.5 ? 'var(--red)' : lastMag > 0.3 ? 'var(--amber)' : 'var(--green)';
  const dbColor  = lastDb  > 80  ? 'var(--red)' : lastDb  > 70  ? 'var(--amber)' : 'var(--green)';

  return (
    <div className="live-monitor" style={{marginBottom:24}}>
      {/* Header */}
      <div className="live-header" style={{justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div className="chart-title"><Icon name="signal"/>Live Trip Monitor</div>
          {active && (
            <span style={{display:'flex',alignItems:'center',gap:6,fontSize:10,
              color:'var(--green)',letterSpacing:'0.5px'}}>
              <span style={{width:7,height:7,borderRadius:'50%',background:'var(--green)',
                animation:'pulse-dot 1.2s ease infinite',display:'inline-block'}}/>
              LIVE · {fmtTime(elapsed)}
            </span>
          )}
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {active && (
            <span style={{fontSize:10,color:'var(--text3)'}}>
              Synthetic data · mirrors WebSocket schema
            </span>
          )}
          {!active
            ? <button onClick={() => setActive(true)} style={{
                padding:'6px 14px',borderRadius:6,border:'1px solid rgba(0,230,118,0.3)',
                background:'rgba(0,230,118,0.08)',color:'var(--green)',cursor:'pointer',
                fontSize:11,fontFamily:'var(--font-mono)',letterSpacing:'0.5px'}}>
                ▶ Start Demo Trip
              </button>
            : <button onClick={handleStop} style={{
                padding:'6px 14px',borderRadius:6,border:'1px solid rgba(255,82,82,0.3)',
                background:'rgba(255,82,82,0.08)',color:'var(--red)',cursor:'pointer',
                fontSize:11,fontFamily:'var(--font-mono)',letterSpacing:'0.5px'}}>
                ■ End Trip
              </button>
          }
        </div>
      </div>

      {/* Idle state */}
      {!active ? (
        <div className="idle-state">
          <div style={{fontSize:28,opacity:0.25,letterSpacing:8}}>◦ ◦ ◦</div>
          <div style={{fontSize:12,color:'var(--text3)'}}>
            Press "Start Demo Trip" to see live sensor monitoring
          </div>
          <div style={{fontSize:10,color:'var(--text3)',opacity:0.6,marginTop:4}}>
            Charts use same Chart.js style as trip detail · Scrolling time axis · 1s tick
          </div>
        </div>
      ) : (
        <div>
          {/* Alert banner */}
          {lastAlert && (
            <div style={{
              padding:'12px 16px', borderRadius:8, marginBottom:14,
              background: lastAlert.sev === 'high' ? 'var(--red2)' : 'var(--amber2)',
              border:`1px solid ${lastAlert.sev === 'high' ? 'rgba(255,82,82,0.3)' : 'rgba(255,171,64,0.3)'}`,
              display:'flex', alignItems:'center', gap:10,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke={lastAlert.sev === 'high' ? 'var(--red)' : 'var(--amber)'}
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div style={{flex:1}}>
                <div style={{fontFamily:'var(--font-head)',fontSize:13,fontWeight:700,
                  color: lastAlert.sev === 'high' ? 'var(--red)' : 'var(--amber)'}}>
                  {lastAlert.msg.replace(/^[⚠️\s]+/,'').trim()}
                </div>
                <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>
                  {lastAlert.sev} severity · t={elapsed}s
                </div>
              </div>
            </div>
          )}

          {/* Accel chart card */}
          <div className="chart-card" style={{marginBottom:12}}>
            <div className="chart-header">
              <div className="chart-title">
                <Icon name="signal" size={13}/>Acceleration Timeline
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontFamily:'var(--font-head)',fontSize:18,fontWeight:700,color:magColor}}>
                  {lastMag.toFixed(3)}<span style={{fontSize:10,color:'var(--text3)',marginLeft:2}}>g</span>
                </span>
                <span style={{fontSize:10,color:'var(--text2)'}}>
                  {lastMag > 0.5
                    ? <span style={{color:'var(--red)'}}>⚠ HARSH</span>
                    : <span style={{color:'var(--green)'}}>✓ normal</span>}
                </span>
              </div>
            </div>
            <LiveAccelChart points={accelPts} alerts={accelAlerts}/>
          </div>

          {/* Audio chart card */}
          <div className="chart-card" style={{marginBottom:12}}>
            <div className="chart-header">
              <div className="chart-title">
                <Icon name="signal" size={13}/>Audio Intensity
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontFamily:'var(--font-head)',fontSize:18,fontWeight:700,color:dbColor}}>
                  {lastDb.toFixed(1)}<span style={{fontSize:10,color:'var(--text3)',marginLeft:2}}>dB</span>
                </span>
                <span style={{fontSize:10,color:'var(--text2)'}}>
                  {lastDb > 80
                    ? <span style={{color:'var(--red)'}}>⚠ LOUD</span>
                    : lastDb > 70
                      ? <span style={{color:'var(--amber)'}}>elevated</span>
                      : <span style={{color:'var(--green)'}}>✓ normal</span>}
                </span>
              </div>
            </div>
            <LiveAudioChart points={audioPts} alerts={audioAlerts}/>
          </div>

          {/* Live fare strip */}
          <div style={{display:'flex',alignItems:'center',gap:16,padding:'10px 16px',
            background:'var(--bg3)',borderRadius:8,border:'1px solid var(--border)'}}>
            <Icon name="dollar" size={13}/>
            <span style={{fontSize:11,color:'var(--text2)'}}>Live fare accumulating</span>
            <span style={{fontFamily:'var(--font-head)',fontSize:17,fontWeight:700,
              color:'var(--green)',marginLeft:'auto'}}>
              ₹{earnings.toFixed(0)}
            </span>
            <span style={{fontSize:10,color:'var(--text3)'}}>
              ~₹{((earnings / Math.max(elapsed, 1)) * 3600).toFixed(0)}/hr
            </span>
          </div>

          {/* Data source note */}
          <div style={{marginTop:10,fontSize:10,color:'var(--text3)',textAlign:'center'}}>
            Demo mode · Synthetic sensor data (not from CSV) · Mirrors live WebSocket schema:
            &nbsp;<code style={{color:'var(--text3)'}}>{'{ ax, ay, az, audio_db }'}</code> at
            &nbsp;<code style={{color:'var(--text3)'}}>/stream_sensor_data</code>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-dot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.4; transform:scale(0.7); }
        }
      `}</style>
    </div>
  );
}
