type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const normalizeContext = (context?: LogContext): Record<string, unknown> | undefined => {
  if (!context) {
    return undefined;
  }

  const entries = Object.entries(context).map(([key, value]) => {
    if (value instanceof Error) {
      return [
        key,
        {
          message: value.message,
          stack: value.stack,
          name: value.name,
        },
      ];
    }

    return [key, value];
  });

  return Object.fromEntries(entries);
};

const output = (level: LogLevel, message: string, context?: LogContext) => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(normalizeContext(context) ?? {}),
  };

  const text = JSON.stringify(payload);

  if (level === "error") {
    console.error(text);
  } else if (level === "warn") {
    console.warn(text);
  } else {
    console.log(text);
  }
};

export const logger = {
  debug: (message: string, context?: LogContext) =>
    output("debug", message, context),
  info: (message: string, context?: LogContext) =>
    output("info", message, context),
  warn: (message: string, context?: LogContext) =>
    output("warn", message, context),
  error: (message: string, context?: LogContext) =>
    output("error", message, context),
};
