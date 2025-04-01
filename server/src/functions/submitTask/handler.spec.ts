import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { main as submitTaskHandler } from './handler';
import { Context } from 'aws-lambda';
import { TaskRequest } from '../../../../shared/models/task';

const dynamoMock = mockClient(DynamoDBClient);
const sqsMock = mockClient(SQSClient);

describe('submitTask handler', () => {
  const context = {} as Context;
  const callback = () => {};

  function makeEvent(task: TaskRequest): any {
    return {
      headers: [],
      body: task,
    };
  }

  beforeEach(() => {
    dynamoMock.reset();
    sqsMock.reset();
  });

  it('should submit task successfully', async () => {
    dynamoMock.on(PutItemCommand).resolves({});
    sqsMock.on(SendMessageCommand).resolves({});

    const event = makeEvent({
      taskId: 'test-task-1',
      answer: '42',
    });

    const result = await submitTaskHandler(event, context, callback);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.message).toContain('Submitted task test-task-1');
  });

  it('should return 500 on error during submission', async () => {
    dynamoMock.on(PutItemCommand).rejects(new Error('DB error'));
    const event = makeEvent({
      taskId: 'test-task-2',
      answer: 'error-case',
    });

    const result = await submitTaskHandler(event, context, callback);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Failed to submit task');
    expect(body.error).toBe('DB error');
  });
});
