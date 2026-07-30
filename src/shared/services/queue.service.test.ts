import { SQSClient, SendMessageCommand, SendMessageCommandInput } from '@aws-sdk/client-sqs';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it } from 'vitest';
import { QueueService } from './queue.service';

const sqsMock = mockClient(SQSClient);

describe('QueueService Unit Tests', () => {
  beforeEach(() => {
    sqsMock.reset();
  });

  it('should send player registration event to standard SQS queue', async () => {
    sqsMock.on(SendMessageCommand).resolves({ MessageId: 'msg-123' });
    const service = new QueueService(
      sqsMock as unknown as SQSClient,
      'https://sqs.us-east-1.amazonaws.com/123/Queue'
    );

    const result = await service.sendPlayerRegistrationEvent({
      teamId: 'TeamA',
      playerId: 'P1',
      name: 'John',
      email: 'john@example.com',
    });

    expect(result.messageId).toBe('msg-123');
    expect(result.eventId).toBeDefined();
    expect(sqsMock.calls()).toHaveLength(1);
  });

  it('should include FIFO parameters when queue URL ends with .fifo', async () => {
    sqsMock.on(SendMessageCommand).resolves({ MessageId: 'fifo-msg-123' });
    const service = new QueueService(
      sqsMock as unknown as SQSClient,
      'https://sqs.us-east-1.amazonaws.com/123/Queue.fifo'
    );

    const result = await service.sendPlayerRegistrationEvent({
      teamId: 'TeamA',
      playerId: 'P1',
      name: 'John',
      email: 'john@example.com',
      eventId: 'evt-custom-123',
    });

    expect(result.messageId).toBe('fifo-msg-123');
    expect(result.eventId).toBe('evt-custom-123');

    const callInput = sqsMock.call(0).args[0].input as SendMessageCommandInput;
    expect(callInput.MessageDeduplicationId).toBe('evt-custom-123');
    expect(callInput.MessageGroupId).toBe('TeamA');
  });
});
