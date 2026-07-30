import { SESClient } from '@aws-sdk/client-ses';
import { config } from '@config/environment';

export const sesClient = new SESClient({ region: config.awsRegion });
