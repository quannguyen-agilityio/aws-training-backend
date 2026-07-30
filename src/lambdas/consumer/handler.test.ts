import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { handler } from './handler';

const ddbMock = mockClient(DynamoDBDocumentClient);
const sesMock = mockClient(SESClient);

describe('Consumer Handler Entry Point Unit Tests', () => {
  beforeEach(() => {
    process.env.SENDER_EMAIL = 'noreply@example.com';
    ddbMock.reset();
    sesMock.reset();
  });

  it('should process batch records and return empty batchItemFailures on success', async () => {
    ddbMock.on(GetCommand).resolves({ Item: undefined });
    ddbMock.on(PutCommand).resolves({});
    sesMock.on(SendEmailCommand).resolves({ MessageId: 'ses-msg-101' });

    const event = {
      Records: [
        {
          messageId: 'msg-101',
          body: JSON.stringify({
            teamId: 'TeamA',
            playerId: 'P1',
            email: 'john@example.com',
          }),
        },
      ],
    };

    const result = await handler(event);
    expect(result.batchItemFailures).toEqual([]);
  });
});
