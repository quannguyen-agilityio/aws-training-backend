import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from './handler';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Producer Handler Entry Point Unit Tests', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  it('should delegate GET request to ProducerController and return 200', async () => {
    ddbMock.on(ScanCommand).resolves({ Items: [] });

    const event = { httpMethod: 'GET' };
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
  });
});
