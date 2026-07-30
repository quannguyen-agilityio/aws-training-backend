import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';

/**
 * ============================================================================
 * AMPLIFY GEN 2 - API GATEWAY SERVICE MODULE (REST API & Cognito Security)
 * ============================================================================
 * Defines REST API Gateway endpoints and security integration:
 *  - API Gateway Name: apexApi-${env}
 *  - Cognito Authorizer: Validates JWT ID Token issued by Cognito User Pool
 *  - Endpoints:
 *     - GET  /players           -> Producer Lambda (Public)
 *     - POST /players           -> Producer Lambda (Cognito Authorizer)
 *     - DELETE /players/{id}    -> Producer Lambda (Cognito Authorizer)
 *     - OPTIONS                 -> Mock CORS Preflight
 */
export function createApiResources(
  stack: cdk.Stack,
  env: string,
  userPoolArn: string,
  producerFunction: lambda.IFunction
) {
  const restApi = new apigateway.RestApi(stack, 'RestApi', {
    restApiName: `apexApi-${env}`,
    description: 'REST API Gateway for ApexAthletes application (Amplify Gen 2)',
    endpointTypes: [apigateway.EndpointType.REGIONAL],
    defaultCorsPreflightOptions: {
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowHeaders: [
        'Content-Type',
        'X-Amz-Date',
        'Authorization',
        'X-Api-Key',
        'X-Amz-Security-Token',
      ],
    },
  });

  const cognitoAuthorizer = new apigateway.CfnAuthorizer(stack, 'CognitoAuthorizer', {
    name: 'CognitoUserPoolAuthorizer',
    type: 'COGNITO_USER_POOLS',
    restApiId: restApi.restApiId,
    identitySource: 'method.request.header.Authorization',
    providerArns: [userPoolArn],
  });

  const playersResource = restApi.root.addResource('players');
  const playerIdResource = playersResource.addResource('{playerId}');

  const producerIntegration = new apigateway.LambdaIntegration(producerFunction, {
    proxy: true,
  });

  // GET /players (Public access)
  playersResource.addMethod('GET', producerIntegration, {
    authorizationType: apigateway.AuthorizationType.NONE,
  });

  // POST /players (Protected by Cognito Authorizer)
  playersResource.addMethod('POST', producerIntegration, {
    authorizationType: apigateway.AuthorizationType.COGNITO,
    authorizer: { authorizerId: cognitoAuthorizer.ref },
  });

  // DELETE /players/{playerId} (Protected by Cognito Authorizer)
  playerIdResource.addMethod('DELETE', producerIntegration, {
    authorizationType: apigateway.AuthorizationType.COGNITO,
    authorizer: { authorizerId: cognitoAuthorizer.ref },
  });

  return { restApi, cognitoAuthorizer };
}
