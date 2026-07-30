import { CreatePlayerInput } from '@shared/types';

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export function validatePlayerInput(input: Partial<CreatePlayerInput>): ValidationResult {
  if (!input || typeof input !== 'object') {
    return { isValid: false, message: 'Invalid request body: expected an object.' };
  }

  if (!input.teamId || typeof input.teamId !== 'string' || input.teamId.trim() === '') {
    return { isValid: false, message: 'Validation Error: teamId is required.' };
  }

  if (!input.playerId || typeof input.playerId !== 'string' || input.playerId.trim() === '') {
    return { isValid: false, message: 'Validation Error: playerId is required.' };
  }

  if (!input.email || typeof input.email !== 'string' || input.email.trim() === '') {
    return { isValid: false, message: 'Validation Error: email is required.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    return { isValid: false, message: 'Validation Error: email format is invalid.' };
  }

  return { isValid: true };
}
