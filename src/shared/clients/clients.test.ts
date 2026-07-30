import { describe, it, expect } from 'vitest';
import { config } from '@config/environment';
import { docClient } from '@shared/clients/dynamodb.client';
import { sqsClient } from '@shared/clients/sqs.client';
import { sesClient } from '@shared/clients/ses.client';

describe('AWS SDK Singletons & Config Unit Tests', () => {
  it('should load environment configuration correctly', () => {
    expect(config.awsRegion).toBeDefined();
    expect(config.tableName).toBeDefined();
    expect(config.awsRegion).toBe(process.env.AWS_REGION || 'ap-southeast-2');
  });

  it('should initialize DynamoDB document client singleton', () => {
    expect(docClient).toBeDefined();
  });

  it('should initialize SQS client singleton', () => {
    expect(sqsClient).toBeDefined();
  });

  it('should initialize SES client singleton', () => {
    expect(sesClient).toBeDefined();
  });
});
