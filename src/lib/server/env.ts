import 'server-only';

/**
 * Validated environment values available only to server integrations.
 */
export interface ServerEnvironment {
  serperApiKey: string;
}

/**
 * Indicates that required server configuration is unavailable at runtime.
 */
export class ServerEnvironmentError extends Error {
  readonly code = 'MISSING_SERPER_API_KEY';

  constructor() {
    super('Serper API key is not configured.');
    this.name = 'ServerEnvironmentError';
  }
}

/**
 * Reads and validates the server-only environment required by search integrations.
 *
 * @returns Validated server environment values.
 * @throws ServerEnvironmentError When the Serper API key is missing or blank.
 */
export function getServerEnvironment(): ServerEnvironment {
  const serperApiKey = process.env.SERPER_API_KEY?.trim();

  if (!serperApiKey) {
    throw new ServerEnvironmentError();
  }

  return { serperApiKey };
}
