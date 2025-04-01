import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

const dynamo = new DynamoDBClient({});
const sqs = new SQSClient({});

const TABLE_NAME = process.env.TASK_TABLE as string;
const QUEUE_URL = process.env.TASK_QUEUE_URL as string;
const DLQ_URL = process.env.DLQ_URL as string;

export const main = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const { taskId, answer, attempt = 0 } = JSON.parse(record.body);

    try {
      if (Math.random() < 0.3) {
        throw new Error('Simulated failure');
      }

      await dynamo.send(
        new UpdateItemCommand({
          TableName: TABLE_NAME,
          Key: {
            taskId: { S: taskId },
          },
          UpdateExpression: 'SET #status = :status, retries = :r, errorMessage = :e',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': { S: 'Processed' },
            ':r': { N: attempt.toString() },
            ':e': { S: '' },
          },
        }),
      );

      console.log(`Task ${taskId} processed successfully`);
    } catch (error) {
      const retryCount = attempt + 1;

      if (retryCount < 2) {
        await dynamo.send(
          new UpdateItemCommand({
            TableName: TABLE_NAME,
            Key: {
              taskId: { S: taskId },
            },
            UpdateExpression: 'SET retries = :r',
            ExpressionAttributeValues: {
              ':r': { N: retryCount.toString() },
            },
          }),
        );

        await sqs.send(
          new SendMessageCommand({
            QueueUrl: QUEUE_URL,
            MessageBody: JSON.stringify({
              taskId,
              answer,
              attempt: retryCount,
            }),
            DelaySeconds: Math.min(Math.pow(2, retryCount) * 5, 900),
          }),
        );

        console.warn(`Retry #${retryCount} scheduled for task ${taskId}`);
      } else {
        await dynamo.send(
          new UpdateItemCommand({
            TableName: TABLE_NAME,
            Key: {
              taskId: { S: taskId },
            },
            UpdateExpression: 'SET #status = :status, retries = :r, errorMessage = :e',
            ExpressionAttributeNames: {
              '#status': 'status',
            },
            ExpressionAttributeValues: {
              ':status': { S: 'Failed' },
              ':r': { N: retryCount.toString() },
              ':e': { S: error.message },
            },
          }),
        );

        await sqs.send(
          new SendMessageCommand({
            QueueUrl: DLQ_URL,
            MessageBody: JSON.stringify({
              taskId,
              answer,
              error: error.message,
            }),
          }),
        );

        console.error(`Task ${taskId} failed permanently: ${error.message}`);
      }
    }
  }

  return { statusCode: 200 };
};
