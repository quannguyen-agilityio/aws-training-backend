import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';

/**
 * ============================================================================
 * AMPLIFY GEN 2 - COMPUTE SERVICE MODULE (Lambda Functions & Event Triggers)
 * ============================================================================
 * Defines serverless compute infrastructure:
 *  1. Producer Lambda Function (PlayerOnboardingProducer-${env}):
 *     - Entry point for API Gateway REST requests
 *     - Node.js 22 runtime, 256MB memory, 30s timeout
 *  2. Consumer Lambda Function (PlayerOnboardingConsumer-${env}):
 *     - Background consumer triggered by SQS queue messages (Batch size 10)
 *     - Node.js 22 runtime, 256MB memory, 30s timeout
 */
export function createFunctionResources(
  stack: cdk.Stack,
  env: string,
  producerRole: iam.IRole,
  consumerRole: iam.IRole,
  table: dynamodb.ITable,
  queue: sqs.IQueue,
  topic: sns.ITopic
) {
  const producerFunction = new lambda.Function(stack, 'ProducerFunction', {
    functionName: `PlayerOnboardingProducer-${env}`,
    runtime: lambda.Runtime.NODEJS_22_X,
    memorySize: 256,
    timeout: cdk.Duration.seconds(30),
    role: producerRole,
    code: lambda.Code.fromInline(
      "exports.handler = async (event) => { return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ message: 'Producer placeholder' }) }; };"
    ),
    handler: 'index.handler',
    environment: {
      NODE_ENV: env,
      TABLE_NAME: table.tableName,
      QUEUE_URL: queue.queueUrl,
      SNS_TOPIC_ARN: topic.topicArn,
    },
  });

  const consumerFunction = new lambda.Function(stack, 'ConsumerFunction', {
    functionName: `PlayerOnboardingConsumer-${env}`,
    runtime: lambda.Runtime.NODEJS_22_X,
    memorySize: 256,
    timeout: cdk.Duration.seconds(30),
    role: consumerRole,
    code: lambda.Code.fromInline(
      "exports.handler = async (event) => { return { statusCode: 200, body: JSON.stringify({ message: 'Consumer placeholder' }) }; };"
    ),
    handler: 'index.handler',
    environment: {
      NODE_ENV: env,
      TABLE_NAME: table.tableName,
      SES_SENDER_EMAIL: 'nquan1007+sesSender@gmail.com',
    },
  });

  // Configure SQS Event Source Trigger for Consumer Lambda
  consumerFunction.addEventSource(
    new lambdaEventSources.SqsEventSource(queue, {
      batchSize: 10,
      enabled: true,
    })
  );

  return { producerFunction, consumerFunction };
}
