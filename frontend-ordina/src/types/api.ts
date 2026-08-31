export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    message: string;
    details?: unknown;
  };
};

export type HealthStatus = {
  service: string;
  status: string;
  database: string;
  engine: string;
};
