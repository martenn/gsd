export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
}

export interface ReadinessStatus {
  status: 'ready' | 'not_ready';
  timestamp: string;
  checks: {
    database: 'up' | 'down';
  };
}
