import { SQSClient } from '@aws-sdk/client-sqs';
import { config } from '@config/environment';

export const sqsClient = new SQSClient({ region: config.awsRegion });
