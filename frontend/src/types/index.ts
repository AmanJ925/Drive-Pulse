// ── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  sub: string;
  role: 'driver' | 'admin';
  exp: number;
}

export interface LoginResponse {
  token: string;
  driver?: Driver;
}

// ── Driver ───────────────────────────────────────────────────────────────────
export interface Driver {
  driver_id: string;
  name: string;
  city: string;
  rating: number;
  avg_earnings_per_hour: number;
  experience_months: number;
  shift_preference: string;
}

// ── Trip ─────────────────────────────────────────────────────────────────────
export interface Trip {
  trip_id: string;
  driver_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_min: number;
  distance_km: number;
  fare: number;
  pickup_location: string;
  dropoff_location: string;
  trip_status: string;
  trip_quality_rating?: string;
  stress_score?: number;
  flagged_moments_count?: number;
  max_severity?: string;
}

// ── Trip Detail ───────────────────────────────────────────────────────────────
export interface TripDetail extends Trip {
  safety_score: number;
  flags: Flag[];
  accelerometer: AccelPoint[];
  audio: AudioPoint[];
  duration_sec: number;
  sensor_synthesized: boolean;
  motion_events_count?: number;
  audio_events_count?: number;
}

// ── Flag ─────────────────────────────────────────────────────────────────────
export interface Flag {
  flag_id: string;
  trip_id: string;
  driver_id: string;
  elapsed_seconds: number;
  flag_type: string;
  severity: 'high' | 'medium' | 'low';
  motion_score: number;
  audio_score: number;
  combined_score: number;
  explanation: string;
  context: string;
}

// ── Sensor Data ───────────────────────────────────────────────────────────────
export interface AccelPoint {
  elapsed_seconds: number;
  magnitude: number;
  accel_x: number;
  accel_y: number;
  accel_z: number;
  speed_kmh: number;
  timestamp: string;
}

export interface AudioPoint {
  elapsed_seconds: number;
  audio_level_db: number;
  audio_classification: string;
  sustained_duration_sec: number;
  timestamp: string;
}

// ── Goal & Earnings ───────────────────────────────────────────────────────────
export interface DriverGoal {
  goal_id: string;
  driver_id: string;
  date: string;
  target_earnings: number;
  target_hours: number;
  current_earnings: number;
  current_hours: number;
  status: string;
  earnings_velocity: number;
  goal_completion_forecast: string;
}

export interface VelocityLogEntry {
  log_id: string;
  driver_id: string;
  cumulative_earnings: number;
  elapsed_hours: number;
  current_velocity: number;
  target_velocity: number;
  velocity_delta: number;
  trips_completed: number;
  forecast_status: string;
}

export interface EarningsData {
  goal: DriverGoal;
  velocity_log: VelocityLogEntry[];
  current_earnings: number;
  predicted_end_earnings: number;
  on_track: boolean;
  gap_to_goal: number;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardData {
  driver_id: string;
  today_earnings: number;
  trips_completed: number;
  flagged_events: number;
  current_velocity: number;
  required_velocity: number;
  status: 'ahead' | 'on_track' | 'behind';
  goal: DriverGoal;
  trips: Trip[];
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export interface AdminStats {
  total_drivers: number;
  total_trips: number;
  total_flags: number;
  avg_stress: number;
  high_risk_events: number;
}

export interface AdminDriver extends Driver {
  total_trips: number;
  avg_stress: number;
  total_earnings: number;
}

// ── WebSocket ─────────────────────────────────────────────────────────────────
export interface WSAlert {
  type: 'alert';
  id: number;
  severity: 'high' | 'medium' | 'low';
  message: string;
  payload?: Record<string, unknown>;
  trip_id?: string;
}
