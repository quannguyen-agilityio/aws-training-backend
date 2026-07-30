import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';

/**
 * ============================================================================
 * AMPLIFY GEN 2 - SSM CONFIGURATION SERVICE MODULE (Parameter Store Exports)
 * ============================================================================
 * Exports infrastructure parameters to AWS Systems Manager (SSM) Parameter Store.
 * Used by frontend build scripts (`frontend-ci-cd.yml`) to inject
 * environment variables (`VITE_API_ENDPOINT`, `VITE_USER_POOL_ID`, etc.) dynamically.
 */
export function createSsmParameters(
  stack: cdk.Stack,
  env: string,
  region: string,
  userPoolId: string,
  userPoolClientId: string,
  restApiId: string
) {
  new ssm.StringParameter(stack, 'UserPoolIdSSMParameter', {
    parameterName: `/awstraining/${env}/VITE_USER_POOL_ID`,
    stringValue: userPoolId,
    description: 'Cognito User Pool ID for Frontend (Amplify Gen 2)',
  });

  new ssm.StringParameter(stack, 'AppClientIdSSMParameter', {
    parameterName: `/awstraining/${env}/VITE_USER_POOL_CLIENT_ID`,
    stringValue: userPoolClientId,
    description: 'Cognito User Pool Client ID for Frontend (Amplify Gen 2)',
  });

  new ssm.StringParameter(stack, 'RegionSSMParameter', {
    parameterName: `/awstraining/${env}/VITE_AWS_REGION`,
    stringValue: region,
    description: 'AWS Region for Frontend (Amplify Gen 2)',
  });

  new ssm.StringParameter(stack, 'ApiEndpointSSMParameter', {
    parameterName: `/awstraining/${env}/VITE_API_ENDPOINT`,
    stringValue: `https://${restApiId}.execute-api.${region}.amazonaws.com/${env}`,
    description: 'API Gateway Root URL for Frontend (Amplify Gen 2)',
  });
}
