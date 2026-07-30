import { PlayerRepository } from '@shared/repositories/player.repository';
import { EmailService } from '@shared/services';
import { Player } from '@shared/types';

export interface SqsRecordInput {
  messageId: string;
  body: string;
}

export class ConsumerProcessor {
  private readonly playerRepository: PlayerRepository;
  private readonly emailService: EmailService;

  constructor(
    playerRepository: PlayerRepository = new PlayerRepository(),
    emailService: EmailService = new EmailService()
  ) {
    this.playerRepository = playerRepository;
    this.emailService = emailService;
  }

  async processRecord(record: SqsRecordInput): Promise<void> {
    const { messageId, body } = record;

    let payload: Partial<Player> & { eventId?: string };
    try {
      payload = typeof body === 'string' ? JSON.parse(body) : body;
    } catch (parseErr) {
      console.error(`[ConsumerProcessor] Malformed JSON body in message ${messageId}:`, parseErr);
      // Unrecoverable malformed message, skip without throwing
      return;
    }

    const { teamId, playerId, name, email, eventId, position } = payload;

    console.log(
      `[ConsumerProcessor] Processing record - MessageId: ${messageId}, EventId: ${eventId || 'N/A'}, PlayerId: ${playerId || 'N/A'}, Email: ${email || 'N/A'}`
    );

    if (!teamId || !playerId || !email) {
      console.error(
        `[ConsumerProcessor] Invalid payload in record ${messageId}: missing teamId, playerId, or email.`
      );
      // Unrecoverable invalid payload, skip without throwing
      return;
    }

    // IDEMPOTENCY CHECK
    const existingRecord = await this.playerRepository.findByKey(teamId, playerId);
    if (existingRecord && existingRecord.onboardingStatus === 'COMPLETED') {
      console.log(
        `[ConsumerProcessor] Idempotency trigger: Player ${playerId} (${teamId}) already onboarded. Skipping SES email.`
      );
      return;
    }

    // Step 1: Save/Update Player in DynamoDB (IN_PROGRESS)
    const timestamp = new Date().toISOString();
    const playerItem: Player = {
      teamId,
      playerId,
      name: name || 'New Player',
      email,
      position: position || 'Unassigned',
      eventId: eventId || messageId,
      onboardingStatus: 'IN_PROGRESS',
      updatedAt: timestamp,
    };

    await this.playerRepository.save(playerItem);
    console.log(`[ConsumerProcessor] Saved player record to DynamoDB: ${playerId}`);

    // Step 2: Send Welcome Email via SES
    const emailResult = await this.emailService.sendWelcomeEmail(playerItem);
    console.log(
      `[ConsumerProcessor] SES Welcome Email sent successfully. MessageId: ${emailResult.messageId}`
    );

    // Step 3: Mark Onboarding Status as COMPLETED
    const completedItem: Player = {
      ...playerItem,
      onboardingStatus: 'COMPLETED',
      welcomeEmailSentAt: new Date().toISOString(),
      sesMessageId: emailResult.messageId,
      updatedAt: new Date().toISOString(),
    };

    await this.playerRepository.save(completedItem);
    console.log(`[ConsumerProcessor] Successfully completed onboarding for player ${playerId}`);
  }
}
