export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  route?: string;
  action?: string;
  status?: number;
  durationMs?: number;
  details?: Record<string, unknown>;
  timestamp: string;
}

export const logger = {
  log: (entry: Omit<LogEntry, 'timestamp'>) => {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };
    console.log(JSON.stringify(logEntry));
  },
  info: (message: string, meta: Omit<LogEntry, 'timestamp' | 'level' | 'message'> = {}) => {
    logger.log({ level: 'info', message, ...meta });
  },
  warn: (message: string, meta: Omit<LogEntry, 'timestamp' | 'level' | 'message'> = {}) => {
    logger.log({ level: 'warn', message, ...meta });
  },
  error: (message: string, meta: Omit<LogEntry, 'timestamp' | 'level' | 'message'> = {}) => {
    logger.log({ level: 'error', message, ...meta });
  },
};
