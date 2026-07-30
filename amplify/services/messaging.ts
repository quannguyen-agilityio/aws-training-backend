import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubs from 'aws-cdk-lib/aws-sns-subscriptions';

/**
 * ============================================================================
 * AMPLIFY GEN 2 - MESSAGING SERVICE MODULE (SQS & SNS Infrastructure)
 * ============================================================================
 * Provisions messaging infrastructure for decoupled asynchronous processing:
 *  - Dead-Letter Queue (DLQ): PlayerOnboardingDLQ-${env} (14-day retention)
 *  - Main Queue: PlayerOnboardingQueue-${env} (300s visibility timeout, redrive 3 retries)
 *  - SNS Topic: PlayerOnboardingTopic-${env}
 *  - Subscription: Subscribes SQS Queue to SNS Topic with rawMessageDelivery enabled
 */
export function createMessagingResources(stack: cdk.Stack, env: string) {
  const playerOnboardingDLQ = new sqs.Queue(stack, 'PlayerOnboardingDLQ', {
    queueName: `PlayerOnboardingDLQ-${env}`,
    retentionPeriod: cdk.Duration.days(14),
  });

  const playerOnboardingQueue = new sqs.Queue(stack, 'PlayerOnboardingQueue', {
    queueName: `PlayerOnboardingQueue-${env}`,
    visibilityTimeout: cdk.Duration.seconds(300),
    deadLetterQueue: {
      queue: playerOnboardingDLQ,
      maxReceiveCount: 3,
    },
  });

  const playerOnboardingTopic = new sns.Topic(stack, 'PlayerOnboardingTopic', {
    topicName: `PlayerOnboardingTopic-${env}`,
  });

  // Subscribe SQS Queue to SNS Topic (Raw Message Delivery enabled)
  playerOnboardingTopic.addSubscription(
    new snsSubs.SqsSubscription(playerOnboardingQueue, {
      rawMessageDelivery: true,
    })
  );

  return { playerOnboardingDLQ, playerOnboardingQueue, playerOnboardingTopic };
}
