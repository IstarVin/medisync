/**
 * Structured logging utility for the application
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
	userId?: string;
	studentId?: string;
	visitId?: string;
	nurseId?: string;
	contactId?: string;
	action?: string;
	duration?: number;
	error?: Error | string;
	status?: string;
	operation?: string;
	visitType?: string;
	isEmergency?: boolean;
	emergencyContactsCount?: number;
	visitsCount?: number;
	nursesCount?: number;
	metadata?: Record<string, unknown>;
}

/**
 * Create a structured log entry
 */
function createLogEntry(level: LogLevel, message: string, context?: LogContext) {
	const entry = {
		timestamp: new Date().toISOString(),
		level,
		message,
		...context
	};

	// Remove undefined values
	return Object.fromEntries(Object.entries(entry).filter(([, value]) => value !== undefined));
}

/**
 * Log debug information
 */
export function logDebug(message: string, context?: LogContext) {
	if (process.env.NODE_ENV === 'development') {
		console.debug(JSON.stringify(createLogEntry('debug', message, context)));
	}
}

/**
 * Log informational messages
 */
export function logInfo(message: string, context?: LogContext) {
	console.info(JSON.stringify(createLogEntry('info', message, context)));
}

/**
 * Log warning messages
 */
export function logWarn(message: string, context?: LogContext) {
	console.warn(JSON.stringify(createLogEntry('warn', message, context)));
}

/**
 * Log error messages
 */
export function logError(message: string, context?: LogContext) {
	console.error(JSON.stringify(createLogEntry('error', message, context)));
}

/**
 * Performance monitoring wrapper
 */
export async function withPerformanceLogging<T>(
	operation: string,
	fn: () => Promise<T>,
	context?: LogContext
): Promise<T> {
	const startTime = Date.now();

	try {
		logDebug(`Starting ${operation}`, context);
		const result = await fn();
		const duration = Date.now() - startTime;

		logInfo(`Completed ${operation}`, {
			...context,
			duration,
			status: 'success'
		});

		return result;
	} catch (error) {
		const duration = Date.now() - startTime;

		logError(`Failed ${operation}`, {
			...context,
			duration,
			error: error instanceof Error ? error.message : String(error),
			status: 'error'
		});

		throw error;
	}
}

/**
 * Log database query performance
 */
export function logDatabaseQuery(operation: string, duration: number, context?: LogContext) {
	const level = duration > 1000 ? 'warn' : 'debug'; // Warn for slow queries

	const message =
		duration > 1000 ? `Slow database query: ${operation}` : `Database query: ${operation}`;

	const logFn = level === 'warn' ? logWarn : logDebug;
	logFn(message, { ...context, duration, operation: 'database_query' });
}
