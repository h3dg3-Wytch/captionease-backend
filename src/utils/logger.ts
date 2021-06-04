/* eslint-disable no-console */

export type Logger = {
  info: (message: any, ...rest: any[]) => void,
  error: (error: Error, message?: any) => void,
}

export default (label: string): Logger => ({
  info: (message, ...rest) => console.info(`[${label}] info: ${message}`, ...rest),
  error: (error, message = '') => console.error(
    `[${label}] ${message ? `message: ${message}\n` : ''}error: ${error.toString()}`,
  ),
});
