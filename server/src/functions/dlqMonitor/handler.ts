import type { SQSEvent } from 'aws-lambda';

export const main = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    console.warn('🚨 DLQ Message Received:', {
      body: record.body,
      messageId: record.messageId,
      attributes: record.attributes,
    });
  }
};
