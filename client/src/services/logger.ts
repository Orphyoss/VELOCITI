// Client-side logger utility for Velociti Intelligence Platform
// Provides structured logging that mirrors server-side logger patterns

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  operation: string;
  message: string;
  data?: any;
}

class ClientLogger {
  private isDevelopment = import.meta.env.DEV;

  private formatTimestamp(): string {
    return new Date().toISOString().replace('T', ' ').substr(0, 19);
  }

  private formatMessage(service: string, operation: string, message: string, level: LogLevel, data?: any): string {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const levelName = levelNames[level];
    const timestamp = this.formatTimestamp();
    
    let formatted = `[${timestamp}] [${levelName}] [${service}] ${operation}: ${message}`;
    
    if (data && Object.keys(data).length > 0) {
      formatted += `\n  Data: ${JSON.stringify(data, null, 2)}`;
    }
    
    return formatted;
  }

  private shouldLog(level: LogLevel): boolean {
    // In development, log everything. In production, only warn and error
    return this.isDevelopment || level >= LogLevel.WARN;
  }

  debug(service: string, operation: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage(service, operation, message, LogLevel.DEBUG, data));
    }
  }

  info(service: string, operation: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(service, operation, message, LogLevel.INFO, data));
    }
  }

  warn(service: string, operation: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(service, operation, message, LogLevel.WARN, data));
    }
  }

  error(service: string, operation: string, message: string, error?: any, data?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorMsg = error instanceof Error ? error.stack || error.message : JSON.stringify(error);
      const fullData = error ? { ...data, error: errorMsg } : data;
      console.error(this.formatMessage(service, operation, message, LogLevel.ERROR, fullData));
    }
  }
}

// Export singleton instance
export const logger = new ClientLogger();