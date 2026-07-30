import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import * as cdk from 'aws-cdk-lib';
import { createStorageResources } from './services/storage';
import { createMessagingResources } from './services/messaging';
import { createIamResources } from './services/iam';
import { createFunctionResources } from './services/functions';
import { createApiResources } from './services/api';
import { createSsmParameters } from './services/ssm';

/**
 * ============================================================================
 * AMPLIFY GEN 2 - MAIN BACKEND COORDINATOR (MODULAR ARCHITECTURE)
 * ============================================================================
 * Refactored into clean, modular service modules under `amplify/services/`:
 *  - Auth: Cognito authentication definition (./auth/resource)
 *  - Storage: DynamoDB table (./services/storage)
 *  - Messaging: SQS queues, DLQ, SNS topic (./services/messaging)
 *  - IAM: Least-privilege execution roles (./services/iam)
 *  - Functions: Producer & Consumer Lambdas (./services/functions)
 *  - API: REST API Gateway & Cognito Authorizer (./services/api)
 *  - SSM: SSM Parameter Store environment exports (./services/ssm)
 */
export const backend = defineBackend({
  auth,
});

// Initialize Custom Infrastructure Stack
const customStack = backend.createStack('CustomInfrastructureStack');

// Determine environment stage: Ensure sandbox stack does not conflict with branch deployments (develop/staging/prod)
const explicitEnv = customStack.node.tryGetContext('env');
const isSandbox = cdk.Stack.of(customStack).stackName.includes('sandbox');
const env = isSandbox ? 'sandbox' : (explicitEnv || 'dev');
const region = cdk.Stack.of(customStack).region;

// 1. Provision Storage Resources (DynamoDB Table)
const { apexPlayersTable } = createStorageResources(customStack, env);

// 2. Provision Messaging Resources (SQS DLQ, Main Queue, SNS Topic & Subscription)
const { playerOnboardingQueue, playerOnboardingTopic } = createMessagingResources(customStack, env);

// 3. Provision IAM Execution Roles for Producer and Consumer Lambdas
const { producerLambdaRole, consumerLambdaRole } = createIamResources(
  customStack,
  env,
  apexPlayersTable.tableArn,
  playerOnboardingQueue.queueArn,
  playerOnboardingTopic.topicArn
);

// 4. Provision Lambda Functions & SQS Event Triggers
const { producerFunction } = createFunctionResources(
  customStack,
  env,
  producerLambdaRole,
  consumerLambdaRole,
  apexPlayersTable,
  playerOnboardingQueue,
  playerOnboardingTopic
);

// 5. Provision REST API Gateway & Cognito Authorizer
const { restApi } = createApiResources(
  customStack,
  env,
  backend.auth.resources.userPool.userPoolArn,
  producerFunction
);

// 6. Export Environment Variables to SSM Parameter Store
createSsmParameters(
  customStack,
  env,
  region,
  backend.auth.resources.userPool.userPoolId,
  backend.auth.resources.userPoolClient.userPoolClientId,
  restApi.restApiId
);
