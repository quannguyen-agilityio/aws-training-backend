import { defineFunction } from '@aws-amplify/backend';
import { getLambdaEntry } from '../../utils/path';

export const consumerFunction = defineFunction({
  name: 'consumer-function',
  entry: getLambdaEntry('consumer'),
  timeoutSeconds: 60,
});
