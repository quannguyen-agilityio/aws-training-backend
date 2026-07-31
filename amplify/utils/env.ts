/**
 * Utility helper to determine the current environment (develop, staging, prod).
 * Default fallback: 'develop'
 */
export const getEnv = (): string => {
  return process.env.ENV || 'develop';
};
