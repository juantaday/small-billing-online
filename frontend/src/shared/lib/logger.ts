/* Logger frontend centralizado */

export class FrontendLogger {
  info(message: string, context?: unknown) {
    console.info(`[APP] ${message}`, context ?? '');
  }

  warn(message: string, context?: unknown) {
    console.warn(`[APP] ${message}`, context ?? '');
  }

  error(message: string, error?: unknown, context?: unknown) {
    console.error(`[APP] ${message}`, { error, context });
  }
}

export const logger = new FrontendLogger();
