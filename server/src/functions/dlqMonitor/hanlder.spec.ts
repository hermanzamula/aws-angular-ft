import { main as dlqMonitor } from './handler';
import type { SQSEvent } from 'aws-lambda';
import { SQSRecordAttributes } from 'aws-lambda/trigger/sqs';

describe('dlqMonitor handler', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should log all incoming DLQ messages', async () => {
    const event: SQSEvent = {
      Records: [
        {
          messageId: 'msg-1',
          body: '{"taskId":"abc","error":"Something went wrong"}',
          attributes: {} as SQSRecordAttributes,
          messageAttributes: {},
          receiptHandle: '',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:region:123456789012:TaskDLQ',
          awsRegion: 'region',
          md5OfBody: '',
        },
        {
          messageId: 'msg-2',
          body: '{"taskId":"xyz","error":"Oops"}',
          attributes: {} as SQSRecordAttributes,
          messageAttributes: {},
          receiptHandle: '',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:region:123456789012:TaskDLQ',
          awsRegion: 'region',
          md5OfBody: '',
        }
      ]
    };

    await dlqMonitor(event);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('🚨 DLQ Message Received:'), expect.objectContaining({
      body: event.Records[0].body,
      messageId: event.Records[0].messageId
    }));
  });

  it('should handle empty events gracefully', async () => {
    await expect(dlqMonitor({ Records: [] } as SQSEvent)).resolves.not.toThrow();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
