import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import { EmailService } from './email.service';
import { Player } from '@shared/types';

const sesMock = mockClient(SESClient);

describe('EmailService Unit Tests', () => {
  beforeEach(() => {
    sesMock.reset();
  });

  it('should send welcome email via SES successfully', async () => {
    sesMock.on(SendEmailCommand).resolves({ MessageId: 'ses-msg-888' });

    const emailService = new EmailService(sesMock as unknown as SESClient, 'noreply@example.com');

    const player: Player = {
      teamId: 'TeamA',
      playerId: 'P1',
      name: 'John',
      email: 'john@example.com',
      position: 'Forward',
      eventId: 'evt-1',
    };

    const result = await emailService.sendWelcomeEmail(player);

    expect(result.messageId).toBe('ses-msg-888');
    expect(sesMock.calls()).toHaveLength(1);

    const callInput = sesMock.call(0).args[0].input as SendEmailCommandInput;
    expect(callInput.Source).toBe('noreply@example.com');
    expect(callInput.Destination?.ToAddresses).toContain('john@example.com');
  });

  it('should throw error if SENDER_EMAIL is not set', async () => {
    const emailService = new EmailService(sesMock as unknown as SESClient, '');

    const player: Player = {
      teamId: 'TeamA',
      playerId: 'P1',
      name: 'John',
      email: 'john@example.com',
    };

    await expect(emailService.sendWelcomeEmail(player)).rejects.toThrow(
      'SENDER_EMAIL environment variable is not set.'
    );
  });
});
