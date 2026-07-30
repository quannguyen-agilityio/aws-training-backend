import { PlayerRepository } from '@shared/repositories/player.repository';
import { Player } from '@shared/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerService } from './player.service';
import { QueueService } from './queue.service';

describe('PlayerService Unit Tests', () => {
  let playerService: PlayerService;
  let mockPlayerRepo: PlayerRepository;
  let mockQueueService: QueueService;

  beforeEach(() => {
    mockPlayerRepo = {
      findAll: vi.fn(),
      findByKey: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    } as unknown as PlayerRepository;

    mockQueueService = {
      sendPlayerRegistrationEvent: vi.fn(),
    } as unknown as QueueService;

    playerService = new PlayerService(mockPlayerRepo, mockQueueService);
  });

  it('should register player and return status QUEUED', async () => {
    vi.mocked(mockQueueService.sendPlayerRegistrationEvent).mockResolvedValue({
      messageId: 'msg-999',
      eventId: 'evt-888',
    });

    const input = { teamId: 'TeamA', playerId: 'P1', name: 'John', email: 'john@example.com' };
    const result = await playerService.registerPlayer(input);

    expect(result.status).toBe('QUEUED');
    expect(result.eventId).toBe('evt-888');
    expect(result.messageId).toBe('msg-999');
    expect(mockQueueService.sendPlayerRegistrationEvent).toHaveBeenCalledWith(input);
  });

  it('should get all players from repository', async () => {
    const players: Player[] = [
      { teamId: 'TeamA', playerId: 'P1', name: 'John', email: 'john@example.com' },
    ];
    vi.mocked(mockPlayerRepo.findAll).mockResolvedValue(players);

    const result = await playerService.getAllPlayers();
    expect(result).toEqual(players);
  });

  it('should delete player via repository', async () => {
    vi.mocked(mockPlayerRepo.delete).mockResolvedValue();

    await playerService.deletePlayer('TeamA', 'P1');
    expect(mockPlayerRepo.delete).toHaveBeenCalledWith('TeamA', 'P1');
  });
});
