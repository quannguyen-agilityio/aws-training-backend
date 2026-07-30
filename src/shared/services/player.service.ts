import { PlayerRepository } from '@shared/repositories/player.repository';
import { CreatePlayerInput, Player } from '@shared/types';
import { validatePlayerInput } from '@shared/utils';
import { EnqueueResult, QueueService } from './queue.service';

export class PlayerService {
  private readonly playerRepository: PlayerRepository;
  private readonly queueService: QueueService;

  constructor(
    playerRepository: PlayerRepository = new PlayerRepository(),
    queueService: QueueService = new QueueService()
  ) {
    this.playerRepository = playerRepository;
    this.queueService = queueService;
  }

  async registerPlayer(input: CreatePlayerInput): Promise<{
    status: string;
    eventId: string;
    messageId: string;
    playerId: string;
    teamId: string;
  }> {
    const validation = validatePlayerInput(input);
    if (!validation.isValid) {
      throw new Error(validation.message || 'Invalid player input');
    }

    const enqueueResult: EnqueueResult = await this.queueService.sendPlayerRegistrationEvent(input);

    return {
      status: 'QUEUED',
      eventId: enqueueResult.eventId,
      messageId: enqueueResult.messageId,
      playerId: input.playerId,
      teamId: input.teamId,
    };
  }

  async getAllPlayers(): Promise<Player[]> {
    return this.playerRepository.findAll();
  }

  async getPlayerByKey(teamId: string, playerId: string): Promise<Player | null> {
    return this.playerRepository.findByKey(teamId, playerId);
  }

  async deletePlayer(teamId: string, playerId: string): Promise<void> {
    await this.playerRepository.delete(teamId, playerId);
  }
}
