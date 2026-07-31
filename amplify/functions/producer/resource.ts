import { defineFunction, secret } from '@aws-amplify/backend';
import { getEnv } from '../../utils/env';
import { getLambdaEntry } from '../../utils/path';

export const producerFunction = defineFunction({
  name: 'producer-function',
  entry: getLambdaEntry('producer'),
  timeoutSeconds: 30,
  environment: {
    ENV: getEnv(),
    API_SECRET: secret('API_SECRET'),
  },
});


