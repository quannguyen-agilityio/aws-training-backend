import { SQSClient, SendMessageCommand, SendMessageCommandInput } from '@aws-sdk/client-sqs';
import { config } from '@config/environment';
import { sqsClient as defaultSqsClient } from '@shared/clients/sqs.client';
import { CreatePlayerInput } from '@shared/types';
import crypto from 'node:crypto';

export interface EnqueueResult {
  messageId: string;
  eventId: string;
}

export class QueueService {
  private readonly client: SQSClient;
  private readonly queueUrl: string;

  constructor(client: SQSClient = defaultSqsClient, queueUrl: string = config.sqsQueueUrl) {
    this.client = client;
    this.queueUrl = queueUrl;
  }

  async sendPlayerRegistrationEvent(input: CreatePlayerInput): Promise<EnqueueResult> {
    if (!this.queueUrl) {
      throw new Error('SQS_QUEUE_URL configuration missing');
    }

    const eventId = input.eventId || input.idempotencyKey || crypto.randomUUID();
    const payload = {
      ...input,
      eventId,
      queuedAt: new Date().toISOString(),
    };

    const sendParams: SendMessageCommandInput = {
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(payload),
    };

    // FIFO queue deduplication support
    if (this.queueUrl.endsWith('.fifo')) {
      sendParams.MessageDeduplicationId = eventId;
      sendParams.MessageGroupId = input.teamId;
    }

    const command = new SendMessageCommand(sendParams);
    const result = await this.client.send(command);

    return {
      messageId: result.MessageId || 'N/A',
      eventId,
    };
  }
}
