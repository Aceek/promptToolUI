import chalk from 'chalk';

export interface LogLevel {
  info: string;
  warn: string;
  error: string;
  success: string;
}

export interface BusinessLogData {
  action: string;
  details?: string;
  userId?: string;
  resourceId?: string;
}

class Logger {
  private getTimestamp(): string {
    return new Date().toLocaleTimeString('fr-FR', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  private formatMessage(level: string, message: string, color: (text: string) => string): void {
    const timestamp = chalk.gray(`[${this.getTimestamp()}]`);
    const prefix = color(`[BACKEND]`);
    const levelTag = color(`[${level.toUpperCase()}]`);
    console.log(`${timestamp} ${prefix} ${levelTag} ${message}`);
  }

  info(message: string): void {
    this.formatMessage('info', message, chalk.blue);
  }

  warn(message: string): void {
    this.formatMessage('warn', message, chalk.yellow);
  }

  error(message: string): void {
    this.formatMessage('error', message, chalk.red);
  }

  success(message: string): void {
    this.formatMessage('success', message, chalk.green);
  }

  business(data: BusinessLogData): void {
    const timestamp = chalk.gray(`[${this.getTimestamp()}]`);
    const prefix = chalk.blue(`[BACKEND]`);
    const actionTag = chalk.magenta(`[ACTION]`);
    
    let message = `${data.action}`;
    if (data.details) {
      message += ` - ${data.details}`;
    }
    if (data.userId) {
      message += ` (User: ${data.userId})`;
    }
    if (data.resourceId) {
      message += ` (Resource: ${data.resourceId})`;
    }

    console.log(`${timestamp} ${prefix} ${actionTag} ${message}`);
  }
}

export const logger = new Logger();