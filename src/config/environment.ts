import dotenv from 'dotenv';

// Load environment variables from .env file if available
dotenv.config();

export const config = {
  awsRegion: process.env.AWS_REGION || 'ap-southeast-2',
  tableName: process.env.TABLE_NAME || 'PlayersDashboard-Data',
  sqsQueueUrl:
    process.env.SQS_QUEUE_URL ||
    'https://sqs.ap-southeast-2.amazonaws.com/123456789012/ApexQueue.fifo',
  senderEmail: process.env.SENDER_EMAIL || 'noreply@example.com',
};

export type AppConfig = typeof config;
