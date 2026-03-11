import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { AccelPoint, AudioPoint, Flag, VelocityLogEntry, DriverGoal } from '../types';

Chart.register(...registerables);

// ── SVG Icons ─────────────────────────────────────────────────────────────────
export const PulseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const iconPaths: Record<string, React.ReactElement> = {
  dollar: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
  trend: <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
  map: <><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/></>,
  warning: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  arrow: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  back: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  signal: <><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M10.54 16.1a6 6 0 0 1 2.92 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
};

export const Icon = ({ name, size = 14 }: { name: string; size?: number }) => {
  const path = iconPaths[name];
  if (!path) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {path}
    </svg>
  );
};

// ── Shared Badges ─────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }: { status: string }) => {
  const labels: Record<string, string> = {
    ahead: 'Ahead of Goal', on_track: 'On Track', behind: 'Behind', at_risk: 'At Risk',
  };
  return (
    <span className={`status-badge ${status}`}>
      <span className="status-dot"/>
      {labels[status] || status}
    </span>
  );
};

export const QualityBadge = ({ q }: { q: string }) => (
  <span className={`trip-quality ${q}`}>{q}</span>
);

export const SeverityBadge = ({ s }: { s: string }) => (
  <span className={`severity-badge ${s}`}>{s}</span>
);

export const Loading = ({ text = 'Loading…' }: { text?: string }) => (
  <div className="loading"><div className="spinner"/>{text}</div>
);

export const SynthNotice = () => null;

// ── Chart helper ──────────────────────────────────────────────────────────────
function destroyChart(ref: React.MutableRefObject<Chart | null>) {
  if (ref.current) { ref.current.destroy(); ref.current = null; }
}

// ── Acceleration Timeline Chart ───────────────────────────────────────────────
export function AccelChart({ data, flags, durationSec }: {
  data: AccelPoint[];
  flags: Flag[];
  durationSec: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !data?.length) return;
    destroyChart(chartRef);

    const maxTime   = durationSec || data[data.length - 1].elapsed_seconds;
    const threshold = 0.5;
    const lineData  = data.map(d => ({ x: d.elapsed_seconds, y: d.magnitude ?? 0 }));
    const flagPoints = (flags || [])
      .filter(f => f.elapsed_seconds > 0)
      .map(f => ({
        x: f.elapsed_seconds,
        y: Math.max(parseFloat(String(f.motion_score)) || 0, 0.1),
        color: f.severity === 'high' ? '#ff5252' : f.severity === 'medium' ? '#ffab40' : '#00e676',
      }));

    chartRef.current = new Chart(canvasRef.current, {
      type: 'scatter',
      data: {
        datasets: [
          { type: 'line', label: 'Signal', data: lineData, borderColor: '#40c4ff', borderWidth: 1.5,
            fill: true, backgroundColor: 'rgba(64,196,255,0.06)', tension: 0.35, pointRadius: 0, order: 2 },
          { type: 'line', label: 'Threshold',
            data: [{ x: 0, y: threshold }, { x: maxTime, y: threshold }],
            borderColor: 'rgba(255,82,82,0.55)', borderWidth: 1,
            borderDash: [5, 4], pointRadius: 0, fill: false, order: 3 },
          { type: 'scatter', label: 'Flags', data: flagPoints,
            pointBackgroundColor: flagPoints.map(fp => fp.color),
            pointBorderColor: flagPoints.map(fp => fp.color),
            pointRadius: 6, order: 1 },
        ],
      },
      options: {
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
                if (item.datasetIndex === 2) return `Flag at ${Math.round(item.parsed.x)}s — ${item.parsed.y.toFixed(2)}g`;
                return null;
              },
            },
          },
        },
        scales: {
          x: { type: 'linear', min: 0, max: maxTime, grid: { color: '#1a1a1a' },
            ticks: { color: '#666', font: { family: 'DM Mono', size: 10 }, maxTicksLimit: 10,
              callback: v => `${v}s` } },
          y: { min: 0, grid: { color: '#1a1a1a' },
            ticks: { color: '#666', font: { family: 'DM Mono', size: 10 }, callback: v => `${v}g` } },
        },
      },
    } as Parameters<typeof Chart>[1]);
    return () => destroyChart(chartRef);
  }, [data, flags, durationSec]);

  if (!data?.length) return <div className="empty-state" style={{color:'var(--text3)',padding:'40px'}}>No accelerometer data</div>;
  return (
    <div>
      <div className="chart-wrap"><canvas ref={canvasRef}/></div>
      <div className="legend-row">
        <div className="legend-item"><div className="legend-line" style={{background:'#40c4ff'}}/> Signal</div>
        <div className="legend-item"><div className="legend-line" style={{background:'rgba(255,82,82,0.55)',height:1}}/> Threshold (0.5g)</div>
        <div className="legend-item"><div className="legend-dot" style={{background:'#ff5252'}}/> High Risk</div>
        <div className="legend-item"><div className="legend-dot" style={{background:'#ffab40'}}/> Medium Risk</div>
        <div className="legend-item"><div className="legend-dot" style={{background:'#00e676'}}/> Low Risk</div>
      </div>
    </div>
  );
}

// ── Audio Intensity Chart ─────────────────────────────────────────────────────
export function AudioChart({ data, flags, durationSec }: {
  data: AudioPoint[];
  flags: Flag[];
  durationSec: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !data?.length) return;
    destroyChart(chartRef);

    const maxTime   = durationSec || data[data.length - 1].elapsed_seconds;
    const threshold = 70;
    const lineData  = data.map(d => ({ x: d.elapsed_seconds, y: d.audio_level_db ?? 0 }));
    const flagPoints = (flags || [])
      .filter(f => f.elapsed_seconds > 0 && (f.audio_score || 0) > 0.3)
      .map(f => {
        const dB = 70 + (parseFloat(String(f.audio_score)) - 0.3) / 0.7 * 30;
        return {
          x: f.elapsed_seconds,
          y: Math.min(Math.round(dB * 10) / 10, 110),
          color: f.severity === 'high' ? '#ff5252' : f.severity === 'medium' ? '#ffab40' : '#00e676',
        };
      });

    chartRef.current = new Chart(canvasRef.current, {
      type: 'scatter',
      data: {
        datasets: [
          { type: 'line', label: 'Signal', data: lineData, borderColor: '#ce93d8', borderWidth: 1.5,
            fill: true, backgroundColor: 'rgba(206,147,216,0.06)', tension: 0.35, pointRadius: 0, order: 2 },
          { type: 'line', label: 'Threshold',
            data: [{ x: 0, y: threshold }, { x: maxTime, y: threshold }],
            borderColor: 'rgba(255,82,82,0.55)', borderWidth: 1,
            borderDash: [5, 4], pointRadius: 0, fill: false, order: 3 },
          { type: 'scatter', label: 'Flags', data: flagPoints,
            pointBackgroundColor: flagPoints.map(fp => fp.color),
            pointBorderColor: flagPoints.map(fp => fp.color),
            pointRadius: 6, order: 1 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a1a', borderColor: '#333', borderWidth: 1,
            callbacks: {
              title: items => `t = ${Math.round(items[0].parsed.x)}s`,
              label: item => {
                if (item.datasetIndex === 0) return `Audio: ${item.parsed.y.toFixed(1)} dB`;
                if (item.datasetIndex === 2) return `Audio flag at ${Math.round(item.parsed.x)}s — ${item.parsed.y.toFixed(1)} dB`;
                return null;
              },
            },
          },
        },
        scales: {
          x: { type: 'linear', min: 0, max: maxTime, grid: { color: '#1a1a1a' },
            ticks: { color: '#666', font: { family: 'DM Mono', size: 10 }, maxTicksLimit: 10, callback: v => `${v}s` } },
          y: { min: 0, max: 110, grid: { color: '#1a1a1a' },
            ticks: { color: '#666', font: { family: 'DM Mono', size: 10 }, callback: v => `${v} dB` } },
        },
      },
    } as Parameters<typeof Chart>[1]);
    return () => destroyChart(chartRef);
  }, [data, flags, durationSec]);

  if (!data?.length) return <div className="empty-state" style={{color:'var(--text3)',padding:'40px'}}>No audio data</div>;
  return (
    <div>
      <div className="chart-wrap"><canvas ref={canvasRef}/></div>
      <div className="legend-row">
        <div className="legend-item"><div className="legend-line" style={{background:'#ce93d8'}}/> Signal</div>
        <div className="legend-item"><div className="legend-line" style={{background:'rgba(255,82,82,0.55)',height:1}}/> Threshold (70 dB)</div>
      </div>
    </div>
  );
}

// ── Earnings Progress Chart ───────────────────────────────────────────────────
export function EarningsProgressChart({ velocityLog, goal }: {
  velocityLog: VelocityLogEntry[];
  goal: DriverGoal;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    destroyChart(chartRef);
    const labels   = velocityLog.map((_, i) => i + 1);
    const cumEarn  = velocityLog.map(v => v.cumulative_earnings);
    const goalLine = Array(labels.length).fill(goal?.target_earnings ?? 0);

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Earnings', data: cumEarn, borderColor: '#00e676', borderWidth: 2,
            fill: true, backgroundColor: 'rgba(0,230,118,0.12)', tension: 0.4, pointRadius: 3, pointBackgroundColor: '#00e676' },
          { label: 'Goal', data: goalLine, borderColor: 'rgba(255,171,64,0.7)', borderWidth: 1,
            borderDash: [5,3], pointRadius: 0, fill: false },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a1a', borderColor: '#333', borderWidth: 1,
            callbacks: {
              title: items => `Trip #${items[0].label}`,
              label: (item: { raw: unknown }) => `₹ ${typeof item.raw === 'number' ? item.raw.toFixed(0) : item.raw}`,
            },
          },
        },
        scales: {
          x: { grid: { color: '#1a1a1a' },
            ticks: { color: '#666', font: { family: 'DM Mono', size: 10 }, callback: v => `Trip ${v}` },
            title: { display: true, text: 'Trip #', color: '#555', font: { family: 'DM Mono', size: 10 } } },
          y: { grid: { color: '#1a1a1a' },
            ticks: { color: '#666', font: { family: 'DM Mono', size: 10 }, callback: v => `₹${v}` } },
        },
      },
    });
    return () => destroyChart(chartRef);
  }, [velocityLog, goal]);

  return (
    <div>
      <div className="chart-wrap-lg"><canvas ref={canvasRef}/></div>
      <div className="legend-row">
        <div className="legend-item"><div className="legend-line" style={{background:'#00e676'}}/> Cumulative Earnings</div>
        <div className="legend-item"><div className="legend-line" style={{background:'rgba(255,171,64,0.7)'}}/> Daily Goal</div>
      </div>
    </div>
  );
}

// ── Velocity Chart ────────────────────────────────────────────────────────────
export function VelocityChart({ velocityLog, targetVelocity }: {
  velocityLog: VelocityLogEntry[];
  targetVelocity: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !velocityLog?.length) return;
    destroyChart(chartRef);
    const labels   = velocityLog.map((_, i) => i + 1);
    const velocity = velocityLog.map(v => v.current_velocity);
    const target   = Array(labels.length).fill(targetVelocity ?? 175);

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Velocity', data: velocity, borderColor: '#00e676', borderWidth: 2,
            fill: false, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#00e676' },
          { label: 'Target', data: target, borderColor: 'rgba(255,82,82,0.6)', borderWidth: 1,
            borderDash: [4,3], pointRadius: 0, fill: false },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a1a', borderColor: '#333', borderWidth: 1,
            callbacks: {
              label: (item: { raw: unknown }) => `₹${typeof item.raw === 'number' ? item.raw.toFixed(0) : item.raw}/hr`,
            },
          },
        },
        scales: {
          x: { grid: { color: '#1a1a1a' },
            ticks: { color: '#666', font: { family: 'DM Mono', size: 10 }, callback: v => `T${v}` } },
          y: { grid: { color: '#1a1a1a' },
            ticks: { color: '#666', font: { family: 'DM Mono', size: 10 }, callback: v => `₹${v}` } },
        },
      },
    });
    return () => destroyChart(chartRef);
  }, [velocityLog, targetVelocity]);

  return (
    <div>
      <div className="chart-wrap-lg"><canvas ref={canvasRef}/></div>
      <div className="legend-row">
        <div className="legend-item"><div className="legend-line" style={{background:'#00e676'}}/> Earnings Velocity (₹/hr)</div>
        <div className="legend-item"><div className="legend-line" style={{background:'rgba(255,82,82,0.6)'}}/> Target Velocity</div>
      </div>
    </div>
  );
}

// ── Alert Toast ───────────────────────────────────────────────────────────────
export function AlertToast({
  alerts,
  onDismiss,
}: {
  alerts: Array<{ id: number; severity: string; message: string; payload?: Record<string, unknown>; trip_id?: string }>;
  onDismiss?: (id: number) => void;
}) {
  if (!alerts.length) return null;

  const severityIcon = (sev: string) => {
    const color = sev === 'high' ? '#ff5252' : sev === 'medium' ? '#ffab40' : '#00e676';
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        style={{flexShrink:0, marginTop:1}}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    );
  };

  const severityLabel = (sev: string) =>
    sev === 'high' ? 'high severity' : sev === 'medium' ? 'medium severity' : 'low severity';

  // Parse trip_id from payload if not top-level
  const getTripId = (a: typeof alerts[0]) => {
    if (a.trip_id) return a.trip_id;
    if (a.payload?.trip_id) return String(a.payload.trip_id);
    return null;
  };

  // Strip leading ⚠ from message since we now have a proper icon
  const cleanMsg = (msg: string) => msg.replace(/^[⚠️\s]+/, '').trim();

  return (
    <div className="alert-toast-stack">
      {alerts.slice(-3).map((a) => {
        const tripId = getTripId(a);
        const subtitle = [tripId ? `Trip ${tripId}` : null, severityLabel(a.severity)]
          .filter(Boolean).join(' · ');
        return (
          <div key={a.id} className={`toast-card toast-card--${a.severity}`}>
            {/* Left icon */}
            <div className="toast-card__icon">
              {severityIcon(a.severity)}
            </div>

            {/* Body */}
            <div className="toast-card__body">
              <div className="toast-card__title">{cleanMsg(a.message)}</div>
              {subtitle && <div className="toast-card__sub">{subtitle}</div>}
            </div>

            {/* Dismiss */}
            {onDismiss && (
              <button
                className="toast-card__close"
                onClick={() => onDismiss(a.id)}
                aria-label="Dismiss"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
