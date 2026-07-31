import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolves absolute path to a Lambda handler in src/lambdas/
 * @param lambdaName - Name of the lambda folder inside src/lambdas/ (e.g. 'producer', 'consumer')
 * @param handlerFile - Name of the entry file (default: 'handler.ts')
 */
export const getLambdaEntry = (lambdaName: string, handlerFile = 'handler.ts'): string => {
  return path.resolve(__dirname, `../../src/lambdas/${lambdaName}/${handlerFile}`);
};
