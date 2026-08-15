import "server-only";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown> & {
  error?: Error;
};

const LOG_LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function isEnabled(level: LogLevel): boolean {
  const configured = (process.env.LOG_LEVEL ?? "info").toLowerCase() as LogLevel;
  return LOG_LEVELS[level] >= LOG_LEVELS[configured] || LOG_LEVELS[configured] === undefined;
}

/**
 * Structured JSON logger.
 *
 * Emits one JSON object per line so logs can be shipped to any log
 * aggregator. Errors include name/message/stack without leaking request
 * bodies. Do not log secrets (passwords, tokens, hashes).
 */
function write(level: LogLevel, message: string, context?: LogContext): void {
  if (!isEnabled(level)) return;

  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (context) {
    for (const [key, value] of Object.entries(context)) {
      if (value instanceof Error) {
        entry[key] = { name: value.name, message: value.message, stack: value.stack };
      } else {
        entry[key] = value;
      }
    }
  }

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => write("debug", message, context),
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context),
};
