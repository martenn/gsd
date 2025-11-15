export interface ThrottlerConfig {
  ttl: number;
  limit: number;
}

export const THROTTLER_GLOBAL: ThrottlerConfig = {
  ttl: 60,
  limit: 100,
};

export const THROTTLER_AUTH: ThrottlerConfig = {
  ttl: 60,
  limit: 5,
};

export const THROTTLER_HEALTH: ThrottlerConfig = {
  ttl: 60,
  limit: 300,
};
