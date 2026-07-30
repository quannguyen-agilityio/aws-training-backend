import { describe, expect, it } from 'vitest';
import { validatePlayerInput } from './validator.util';

describe('Validator Utility Unit Tests', () => {
  it('should validate valid player input successfully', () => {
    const input = { teamId: 'TeamA', playerId: 'P1', name: 'John', email: 'john@example.com' };
    const result = validatePlayerInput(input);
    expect(result.isValid).toBe(true);
  });

  it('should fail when teamId is missing', () => {
    const input = { teamId: '', playerId: 'P1', email: 'john@example.com' };
    const result = validatePlayerInput(input);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('teamId is required');
  });

  it('should fail when playerId is missing', () => {
    const input = { teamId: 'TeamA', playerId: '', email: 'john@example.com' };
    const result = validatePlayerInput(input);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('playerId is required');
  });

  it('should fail when email is invalid', () => {
    const input = { teamId: 'TeamA', playerId: 'P1', email: 'invalid-email' };
    const result = validatePlayerInput(input);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('email format is invalid');
  });
});
