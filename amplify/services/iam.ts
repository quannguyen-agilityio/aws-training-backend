import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';

/**
 * ============================================================================
 * AMPLIFY GEN 2 - IAM SECURITY SERVICE MODULE (Execution Roles & Policies)
 * ============================================================================
 * Defines least-privilege IAM Roles and Inline Security Policies for Lambda functions:
 *  1. ProducerLambdaRole-${env}:
 *     - AWSLambdaBasicExecutionRole (CloudWatch Logs)
 *     - DynamoDB Read/Delete/Scan permissions on ApexPlayers-${env}
 *     - SQS SendMessage permissions on PlayerOnboardingQueue-${env}
 *     - SNS Publish permissions on PlayerOnboardingTopic-${env}
 *  2. ConsumerLambdaRole-${env}:
 *     - AWSLambdaBasicExecutionRole (CloudWatch Logs)
 *     - DynamoDB Read/Write/Update permissions on ApexPlayers-${env}
 *     - SQS ReceiveMessage/DeleteMessage permissions on PlayerOnboardingQueue-${env}
 *     - SES SendEmail permissions
 */
export function createIamResources(
  stack: cdk.Stack,
  env: string,
  tableArn: string,
  queueArn: string,
  topicArn: string
) {
  // 1. Producer Execution Role
  const producerLambdaRole = new iam.Role(stack, 'ProducerLambdaExecutionRole', {
    roleName: `ProducerLambdaRole-${env}`,
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
    ],
  });

  producerLambdaRole.addToPolicy(
    new iam.PolicyStatement({
      actions: ['dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:DeleteItem', 'dynamodb:Scan'],
      resources: [tableArn, `${tableArn}/index/*`],
    })
  );

  producerLambdaRole.addToPolicy(
    new iam.PolicyStatement({
      actions: ['sqs:SendMessage', 'sqs:GetQueueAttributes', 'sqs:GetQueueUrl'],
      resources: [queueArn],
    })
  );

  producerLambdaRole.addToPolicy(
    new iam.PolicyStatement({
      actions: ['sns:Publish'],
      resources: [topicArn],
    })
  );

  // 2. Consumer Execution Role
  const consumerLambdaRole = new iam.Role(stack, 'ConsumerLambdaExecutionRole', {
    roleName: `ConsumerLambdaRole-${env}`,
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
    ],
  });

  consumerLambdaRole.addToPolicy(
    new iam.PolicyStatement({
      actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:Query'],
      resources: [tableArn],
    })
  );

  consumerLambdaRole.addToPolicy(
    new iam.PolicyStatement({
      actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:GetQueueAttributes'],
      resources: [queueArn],
    })
  );

  consumerLambdaRole.addToPolicy(
    new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'],
    })
  );

  return { producerLambdaRole, consumerLambdaRole };
}
