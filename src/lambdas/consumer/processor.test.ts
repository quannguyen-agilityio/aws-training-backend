import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsumerProcessor } from './processor';
import { PlayerRepository } from '@shared/repositories/player.repository';
import { EmailService } from '@shared/services';
import { Player } from '@shared/types';

describe('ConsumerProcessor Unit Tests', () => {
  let processor: ConsumerProcessor;
  let mockPlayerRepo: PlayerRepository;
  let mockEmailService: EmailService;

  beforeEach(() => {
    mockPlayerRepo = {
      findAll: vi.fn(),
      findByKey: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    } as unknown as PlayerRepository;

    mockEmailService = {
      sendWelcomeEmail: vi.fn(),
    } as unknown as EmailService;

    processor = new ConsumerProcessor(mockPlayerRepo, mockEmailService);
  });

  it('should process SQS record, save IN_PROGRESS, send email and mark COMPLETED', async () => {
    vi.mocked(mockPlayerRepo.findByKey).mockResolvedValue(null);
    vi.mocked(mockEmailService.sendWelcomeEmail).mockResolvedValue({ messageId: 'ses-123' });
    vi.mocked(mockPlayerRepo.save).mockImplementation(async (player: Player) => player);

    const record = {
      messageId: 'msg-1',
      body: JSON.stringify({
        teamId: 'TeamA',
        playerId: 'P1',
        name: 'John',
        email: 'john@example.com',
        eventId: 'evt-1',
      }),
    };

    await processor.processRecord(record);

    expect(mockPlayerRepo.findByKey).toHaveBeenCalledWith('TeamA', 'P1');
    expect(mockPlayerRepo.save).toHaveBeenCalledTimes(2);
    expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledTimes(1);

    const firstSaveCall = vi.mocked(mockPlayerRepo.save).mock.calls[0][0];
    expect(firstSaveCall.onboardingStatus).toBe('IN_PROGRESS');

    const secondSaveCall = vi.mocked(mockPlayerRepo.save).mock.calls[1][0];
    expect(secondSaveCall.onboardingStatus).toBe('COMPLETED');
    expect(secondSaveCall.sesMessageId).toBe('ses-123');
  });

  it('should trigger idempotency check and skip email if already COMPLETED', async () => {
    const existingPlayer: Player = {
      teamId: 'TeamA',
      playerId: 'P1',
      name: 'John',
      email: 'john@example.com',
      onboardingStatus: 'COMPLETED',
    };

    vi.mocked(mockPlayerRepo.findByKey).mockResolvedValue(existingPlayer);

    const record = {
      messageId: 'msg-2',
      body: JSON.stringify({
        teamId: 'TeamA',
        playerId: 'P1',
        email: 'john@example.com',
      }),
    };

    await processor.processRecord(record);

    expect(mockPlayerRepo.findByKey).toHaveBeenCalledWith('TeamA', 'P1');
    expect(mockPlayerRepo.save).not.toHaveBeenCalled();
    expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('should skip malformed JSON without throwing', async () => {
    const record = {
      messageId: 'msg-3',
      body: 'invalid-json-{',
    };

    await processor.processRecord(record);

    expect(mockPlayerRepo.findByKey).not.toHaveBeenCalled();
    expect(mockPlayerRepo.save).not.toHaveBeenCalled();
  });

  it('should skip invalid payload missing teamId/playerId/email without throwing', async () => {
    const record = {
      messageId: 'msg-4',
      body: JSON.stringify({ name: 'No Team' }),
    };

    await processor.processRecord(record);

    expect(mockPlayerRepo.findByKey).not.toHaveBeenCalled();
    expect(mockPlayerRepo.save).not.toHaveBeenCalled();
  });
});
