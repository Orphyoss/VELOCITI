// Comprehensive Logging Service for Velociti Intelligence Platform
// Provides structured logging for development monitoring and error tracking

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  operation: string;
  message: string;
  data?: any;
  error?: any;
  duration?: number;
}

class VelocitiLogger {
  private isDevelopment: boolean;
  private logHistory: LogEntry[] = [];
  private readonly MAX_HISTORY = 1000;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private formatTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substr(0, 19);
  }

  private createLogEntry(
    level: LogLevel,
    service: string,
    operation: string,
    message: string,
    data?: any,
    error?: any,
    duration?: number
  ): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      service,
      operation,
      message,
      data,
      error,
      duration
    };
  }

  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);
    if (this.logHistory.length > this.MAX_HISTORY) {
      this.logHistory.shift();
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.isDevelopment || level >= LogLevel.WARN;
  }

  private formatMessage(entry: LogEntry): string {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];
    const levelName = levelNames[entry.level];
    const duration = entry.duration ? ` (${entry.duration}ms)` : '';
    
    let formatted = `[${entry.timestamp}] [${levelName}] [${entry.service}] ${entry.operation}: ${entry.message}${duration}`;
    
    if (entry.data && Object.keys(entry.data).length > 0) {
      formatted += `\n  Data: ${JSON.stringify(entry.data, null, 2)}`;
    }
    
    if (entry.error) {
      formatted += `\n  Error: ${entry.error instanceof Error ? entry.error.stack : JSON.stringify(entry.error)}`;
    }
    
    return formatted;
  }

  debug(service: string, operation: string, message: string, data?: any): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, service, operation, message, data);
    this.addToHistory(entry);
    
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage(entry));
    }
  }

  info(service: string, operation: string, message: string, data?: any): void {
    const entry = this.createLogEntry(LogLevel.INFO, service, operation, message, data);
    this.addToHistory(entry);
    
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(entry));
    }
  }

  warn(service: string, operation: string, message: string, data?: any): void {
    const entry = this.createLogEntry(LogLevel.WARN, service, operation, message, data);
    this.addToHistory(entry);
    
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(entry));
    }
  }

  error(service: string, operation: string, message: string, error?: any, data?: any): void {
    const entry = this.createLogEntry(LogLevel.ERROR, service, operation, message, data, error);
    this.addToHistory(entry);
    
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(entry));
    }
  }

  critical(service: string, operation: string, message: string, error?: any, data?: any): void {
    const entry = this.createLogEntry(LogLevel.CRITICAL, service, operation, message, data, error);
    this.addToHistory(entry);
    
    console.error(`🚨 CRITICAL: ${this.formatMessage(entry)}`);
  }

  // Performance logging with automatic duration calculation
  async logOperation<T>(
    service: string,
    operation: string,
    description: string,
    asyncFn: () => Promise<T>,
    data?: any
  ): Promise<T> {
    const startTime = Date.now();
    
    this.debug(service, operation, `Starting: ${description}`, data);
    
    try {
      const result = await asyncFn();
      const duration = Date.now() - startTime;
      
      this.info(service, operation, `Completed: ${description}`, { ...data, duration });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.error(service, operation, `Failed: ${description}`, error, { ...data, duration });
      
      throw error;
    }
  }

  // Get recent log history for debugging
  getRecentLogs(count: number = 50, level?: LogLevel): LogEntry[] {
    let filtered = this.logHistory;
    
    if (level !== undefined) {
      filtered = this.logHistory.filter(entry => entry.level >= level);
    }
    
    return filtered.slice(-count);
  }

  // Get error summary for health monitoring
  getErrorSummary(minutesBack: number = 60): { totalErrors: number; criticalErrors: number; services: string[] } {
    const cutoff = new Date(Date.now() - minutesBack * 60 * 1000);
    const recentLogs = this.logHistory.filter(entry => 
      new Date(entry.timestamp) >= cutoff && entry.level >= LogLevel.ERROR
    );
    
    const services = Array.from(new Set(recentLogs.map(entry => entry.service)));
    const criticalErrors = recentLogs.filter(entry => entry.level === LogLevel.CRITICAL).length;
    
    return {
      totalErrors: recentLogs.length,
      criticalErrors,
      services
    };
  }

  // Clear old logs to prevent memory issues
  clearOldLogs(): void {
    const keepCount = Math.floor(this.MAX_HISTORY * 0.8);
    this.logHistory = this.logHistory.slice(-keepCount);
    this.info('Logger', 'maintenance', `Cleared old logs, keeping ${keepCount} recent entries`);
  }
}

// Export singleton instance
export const logger = new VelocitiLogger();

// Convenience functions for common logging patterns
export const logAPI = (endpoint: string, method: string, statusCode: number, duration: number, data?: any) => {
  const level = statusCode >= 400 ? LogLevel.ERROR : statusCode >= 300 ? LogLevel.WARN : LogLevel.INFO;
  const message = `${method} ${endpoint} - ${statusCode}`;
  
  if (level === LogLevel.ERROR) {
    logger.error('API', 'request', message, null, { statusCode, duration, ...data });
  } else if (level === LogLevel.WARN) {
    logger.warn('API', 'request', message, { statusCode, duration, ...data });
  } else {
    logger.info('API', 'request', message, { statusCode, duration, ...data });
  }
};

export const logDatabase = (operation: string, table: string, duration: number, recordCount?: number, error?: any) => {
  if (error) {
    logger.error('Database', operation, `${operation} failed on ${table}`, error, { duration, recordCount });
  } else {
    logger.debug('Database', operation, `${operation} completed on ${table}`, { duration, recordCount });
  }
};

export const logAgent = (agentId: string, operation: string, message: string, data?: any, error?: any) => {
  if (error) {
    logger.error('Agent', operation, `[${agentId}] ${message}`, error, data);
  } else {
    logger.info('Agent', operation, `[${agentId}] ${message}`, data);
  }
};