// Comprehensive logging system for Siidaa Admin Dashboard

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  category: string
  message: string
  data?: unknown
  error?: Error
  url?: string
  method?: string
  status?: number
  duration?: number
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private logLevel: LogLevel = LogLevel.DEBUG

  constructor() {
    // Set log level based on environment
    if (typeof window !== 'undefined') {
      this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
    }
  }

  private createLogEntry(
    level: LogLevel,
    category: string,
    message: string,
    data?: unknown,
    error?: Error,
    metadata?: {
      url?: string
      method?: string
      status?: number
      duration?: number
    }
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      error,
      ...metadata,
    }
  }

  private addLog(entry: LogEntry) {
    // Only log if level is high enough
    if (entry.level < this.logLevel) return

    this.logs.push(entry)
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console output with colors
    this.outputToConsole(entry)
    
    // Store in localStorage for persistence
    this.persistLogs()
  }

  private outputToConsole(entry: LogEntry) {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString()
    const prefix = `[${timestamp}] [${entry.category}]`
    
    const styles = {
      [LogLevel.DEBUG]: 'color: #6b7280',
      [LogLevel.INFO]: 'color: #3b82f6',
      [LogLevel.WARN]: 'color: #f59e0b',
      [LogLevel.ERROR]: 'color: #ef4444',
    }

    const style = styles[entry.level]
    
    if (entry.error) {
      console.group(`%c${prefix} ${entry.message}`, style)
      console.error(entry.error)
      if (entry.data) console.log('Data:', entry.data)
      console.groupEnd()
    } else if (entry.data) {
      console.group(`%c${prefix} ${entry.message}`, style)
      console.log('Data:', entry.data)
      console.groupEnd()
    } else {
      console.log(`%c${prefix} ${entry.message}`, style)
    }
  }

  private persistLogs() {
    if (typeof window !== 'undefined') {
      try {
        const recentLogs = this.logs.slice(-100) // Keep only 100 most recent logs
        localStorage.setItem('siidaa_admin_logs', JSON.stringify(recentLogs))
      } catch (error) {
        // Ignore localStorage errors
      }
    }
  }

  // Public logging methods
  debug(category: string, message: string, data?: unknown) {
    this.addLog(this.createLogEntry(LogLevel.DEBUG, category, message, data))
  }

  info(category: string, message: string, data?: unknown) {
    this.addLog(this.createLogEntry(LogLevel.INFO, category, message, data))
  }

  warn(category: string, message: string, data?: unknown) {
    this.addLog(this.createLogEntry(LogLevel.WARN, category, message, data))
  }

  error(category: string, message: string, error?: Error, data?: unknown) {
    this.addLog(this.createLogEntry(LogLevel.ERROR, category, message, data, error))
  }

  // API-specific logging methods
  apiRequest(method: string, url: string, data?: unknown) {
    this.info('API', `${method} ${url}`, data)
  }

  apiResponse(method: string, url: string, status: number, duration: number, data?: unknown) {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO
    this.addLog(this.createLogEntry(
      level,
      'API',
      `${method} ${url} - ${status}`,
      data,
      undefined,
      { url, method, status, duration }
    ))
  }

  apiError(method: string, url: string, error: Error, duration?: number) {
    this.addLog(this.createLogEntry(
      LogLevel.ERROR,
      'API',
      `${method} ${url} - Failed`,
      undefined,
      error,
      { url, method, duration }
    ))
  }

  // Authentication logging
  authAttempt(username: string) {
    this.info('AUTH', `Login attempt for user: ${username}`)
  }

  authSuccess(username: string) {
    this.info('AUTH', `Login successful for user: ${username}`)
  }

  authFailure(username: string, error: string) {
    this.error('AUTH', `Login failed for user: ${username}`, new Error(error))
  }

  authLogout() {
    this.info('AUTH', 'User logged out')
  }

  // Network connectivity logging
  networkTest(url: string, success: boolean, duration: number, error?: Error) {
    if (success) {
      this.info('NETWORK', `Connection test successful: ${url}`, { duration })
    } else {
      this.error('NETWORK', `Connection test failed: ${url}`, error, { duration })
    }
  }

  // Environment logging
  environment(data: Record<string, unknown>) {
    this.info('ENV', 'Environment information', data)
  }

  // Get logs for display
  getLogs(category?: string, level?: LogLevel): LogEntry[] {
    let filteredLogs = this.logs

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category)
    }

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level)
    }

    return filteredLogs.slice().reverse() // Most recent first
  }

  // Clear logs
  clearLogs() {
    this.logs = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('siidaa_admin_logs')
    }
    this.info('SYSTEM', 'Logs cleared')
  }

  // Export logs
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Load persisted logs
  loadPersistedLogs() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('siidaa_admin_logs')
        if (stored) {
          const parsedLogs = JSON.parse(stored) as LogEntry[]
          this.logs = [...parsedLogs, ...this.logs]
          this.info('SYSTEM', `Loaded ${parsedLogs.length} persisted logs`)
        }
      } catch (error) {
        this.error('SYSTEM', 'Failed to load persisted logs', error as Error)
      }
    }
  }

  // Get log statistics
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
      },
      byCategory: {} as Record<string, number>,
      recentErrors: this.logs
        .filter(log => log.level === LogLevel.ERROR)
        .slice(-5)
        .map(log => ({
          timestamp: log.timestamp,
          category: log.category,
          message: log.message,
          error: log.error?.message,
        })),
    }

    this.logs.forEach(log => {
      // Count by level
      switch (log.level) {
        case LogLevel.DEBUG:
          stats.byLevel.debug++
          break
        case LogLevel.INFO:
          stats.byLevel.info++
          break
        case LogLevel.WARN:
          stats.byLevel.warn++
          break
        case LogLevel.ERROR:
          stats.byLevel.error++
          break
      }

      // Count by category
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1
    })

    return stats
  }
}

// Export singleton instance
export const logger = new Logger()

// Load persisted logs on initialization
if (typeof window !== 'undefined') {
  logger.loadPersistedLogs()
  logger.info('SYSTEM', 'Logger initialized')
}