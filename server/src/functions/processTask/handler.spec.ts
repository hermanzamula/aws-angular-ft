import { mockClient } from 'aws-sdk-client-mock';
import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { main as processTaskHandler } from './handler';

describe('processTask handler', () => {
  const dynamoMock = mockClient(DynamoDBClient);
  const sqsMock = mockClient(SQSClient);
  const originalMathRandom = Math.random;

  beforeEach(() => {
    dynamoMock.reset();
    sqsMock.reset();
    Math.random = originalMathRandom;
  });

  afterAll(() => {
    Math.random = originalMathRandom;
  });

  it('should process task successfully', async () => {
    // Force Math.random to return a value greater than 0.3 (no failure)
    Math.random = () => 0.9;
    const event: SQSEvent = {
      Records: [
        {
          messageId: '1',
          receiptHandle: 'handle',
          body: JSON.stringify({ taskId: 'id1', answer: 'ans', attempt: 0 }),
          attributes: {} as any,
          messageAttributes: {} as any,
          md5OfBody: 'md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn',
          awsRegion: 'us-east-1',
        },
      ],
    };

    dynamoMock.on(UpdateItemCommand).resolves({});
    
    const result = await processTaskHandler(event);
    expect(result.statusCode).toBe(200);

    const calls = dynamoMock.commandCalls(UpdateItemCommand);
    const processedCall = calls.find(call => call.args[0].input.UpdateExpression.includes('SET #status = :status'));
    expect(processedCall).toBeDefined();
  });

  it('should retry processing on failure when retry count < 2', async () => {
    // Force Math.random to return a low value to simulate failure
    Math.random = () => 0.0;
    const event: SQSEvent = {
      Records: [
        {
          messageId: '2',
          receiptHandle: 'handle',
          body: JSON.stringify({ taskId: 'id2', answer: 'ans', attempt: 0 }),
          attributes: {} as any,
          messageAttributes: {} as any,
          md5OfBody: 'md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn',
          awsRegion: 'us-east-1',
        },
      ],
    };

    dynamoMock.on(UpdateItemCommand).resolves({});
    sqsMock.on(SendMessageCommand).resolves({});

    const result = await processTaskHandler(event);
    expect(result.statusCode).toBe(200);

    const updateCalls = dynamoMock.commandCalls(UpdateItemCommand);
    const retryCall = updateCalls.find(call => call.args[0].input.UpdateExpression === 'SET retries = :r');
    expect(retryCall).toBeDefined();

    const sqsCalls = sqsMock.commandCalls(SendMessageCommand);
    expect(sqsCalls.length).toBe(1);
    const messageSent = JSON.parse(sqsCalls[0].args[0].input.MessageBody);
    expect(messageSent.taskId).toBe('id2');
    expect(messageSent.attempt).toBe(1);
  });

  it('should mark task as failed and send message to DLQ when retry count >= 2', async () => {
    Math.random = () => 0.0;
    const event: SQSEvent = {
      Records: [
        {
          messageId: '3',
          receiptHandle: 'handle',
          body: JSON.stringify({ taskId: 'id3', answer: 'ans', attempt: 1 }),
          attributes: {} as any,
          messageAttributes: {} as any,
          md5OfBody: 'md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn',
          awsRegion: 'us-east-1',
        },
      ],
    };

    dynamoMock.on(UpdateItemCommand).resolves({});
    sqsMock.on(SendMessageCommand).resolves({});

    const result = await processTaskHandler(event);
    expect(result.statusCode).toBe(200);

    const updateCalls = dynamoMock.commandCalls(UpdateItemCommand);
    const failureCall = updateCalls.find(call => call.args[0].input.UpdateExpression.includes('SET #status = :status'));
    expect(failureCall).toBeDefined();

    const sqsCalls = sqsMock.commandCalls(SendMessageCommand);
    expect(sqsCalls.length).toBe(1);
    const messageBody = JSON.parse(sqsCalls[0].args[0].input.MessageBody);
    expect(messageBody.taskId).toBe('id3');
    expect(messageBody.error).toBeDefined();
  });
});
