import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { main as getTasksHandler } from './handler';
import { Context } from 'aws-lambda';

const dynamoMock = mockClient(DynamoDBDocumentClient);

describe('getTasks handler', () => {
  const context = {} as Context;
  const event = { headers: [], body: {} } as any;
  const callback = () => {};

  beforeEach(() => {
    dynamoMock.reset();
  });

  it('should return tasks sorted by createdAt (newest first)', async () => {
    dynamoMock.on(ScanCommand).resolves({
      Items: [
        {
          taskId: 'id1',
          answer: 'one',
          createdAt: '2024-12-01T12:00:00.000Z',
        },
        {
          taskId: 'id2',
          answer: 'two',
          createdAt: '2024-12-03T08:00:00.000Z',
        },
      ],
    });

    const result = await getTasksHandler(event, context, callback);

    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(body.items.length).toBe(2);
    expect(body.items[0].taskId).toBe('id2'); // newest task
    expect(body.items[1].taskId).toBe('id1'); // older task
  });

  it('should return empty list if no tasks', async () => {
    dynamoMock.on(ScanCommand).resolves({ Items: [] });

    const result = await getTasksHandler(event, context, callback);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.items).toEqual([]);
  });

  it('should return 500 on error', async () => {
    dynamoMock.on(ScanCommand).rejects(new Error('DB down'));

    const result = await getTasksHandler(event, context, callback);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(500);
    expect(body.message).toBe('Failed to fetch tasks');
  });
});
