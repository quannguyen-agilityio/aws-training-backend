export type OnboardingStatus = 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface PlayerKey {
  teamId: string;
  playerId: string;
}

export interface Player extends PlayerKey {
  name: string;
  email: string;
  position?: string;
  eventId?: string;
  onboardingStatus?: OnboardingStatus;
  welcomeEmailSentAt?: string;
  sesMessageId?: string;
  updatedAt?: string;
}

export interface CreatePlayerInput {
  teamId: string;
  playerId: string;
  name: string;
  email: string;
  position?: string;
  eventId?: string;
  idempotencyKey?: string;
}
