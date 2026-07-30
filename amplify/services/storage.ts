import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

/**
 * ============================================================================
 * AMPLIFY GEN 2 - STORAGE SERVICE MODULE (DynamoDB Table)
 * ============================================================================
 * Provisions the DynamoDB Table resource for the ApexAthletes application.
 *
 * Resource Details:
 *  - Table Name: ApexPlayers-${env}
 *  - Partition Key (HASH): teamId (String)
 *  - Sort Key (RANGE): playerId (String)
 *  - Billing Mode: PAY_PER_REQUEST (On-demand)
 *  - TTL Attribute: 'ttl'
 */
export function createStorageResources(stack: cdk.Stack, env: string) {
  const apexPlayersTable = new dynamodb.Table(stack, 'ApexPlayersTable', {
    tableName: `ApexPlayers-${env}`,
    partitionKey: { name: 'teamId', type: dynamodb.AttributeType.STRING },
    sortKey: { name: 'playerId', type: dynamodb.AttributeType.STRING },
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    timeToLiveAttribute: 'ttl',
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  });

  return { apexPlayersTable };
}
