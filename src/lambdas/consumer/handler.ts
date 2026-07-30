import { ConsumerProcessor, SqsRecordInput } from './processor';

export interface SqsEventInput {
  Records?: SqsRecordInput[];
}

export interface BatchItemFailure {
  itemIdentifier: string;
}

export interface SqsBatchResponse {
  batchItemFailures: BatchItemFailure[];
}

const processor = new ConsumerProcessor();

export async function handler(event: SqsEventInput): Promise<SqsBatchResponse> {
  const records = event.Records || [];
  console.log(`[Consumer Handler] Processing batch of ${records.length} SQS records.`);

  const batchItemFailures: BatchItemFailure[] = [];

  for (const record of records) {
    try {
      await processor.processRecord(record);
    } catch (err: unknown) {
      console.error(`[Consumer Handler] Error processing SQS message ${record.messageId}:`, err);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}
