import { SQSEvent } from 'aws-lambda';
import { DynamoDB, SQS } from 'aws-sdk';

const dynamo = new DynamoDB.DocumentClient();
const sqs = new SQS();

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

      await dynamo.update({
        TableName: TABLE_NAME,
        Key: { taskId },
        UpdateExpression: 'SET #status = :status, retries = :r, errorMessage = :e',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': 'Processed',
          ':r': attempt,
          ':e': ''
        }
      }).promise();

      console.log(`Task ${taskId} processed successfully`);

    } catch (error) {
      const retryCount = attempt + 1;

      if (retryCount < 2) {
        await dynamo.update({
          TableName: TABLE_NAME,
          Key: { taskId },
          UpdateExpression: 'SET retries = :r',
          ExpressionAttributeValues: { ':r': retryCount }
        }).promise();

        await sqs.sendMessage({
          QueueUrl: QUEUE_URL,
          MessageBody: JSON.stringify({ taskId, answer, attempt: retryCount }),
          DelaySeconds: Math.min(Math.pow(2, retryCount) * 5, 900)
        }).promise();

        console.warn(`Retry #${retryCount} scheduled for task ${taskId}`);
      } else {
        await dynamo.update({
          TableName: TABLE_NAME,
          Key: { taskId },
          UpdateExpression: 'SET #status = :status, retries = :r, errorMessage = :e',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':status': 'Failed',
            ':r': retryCount,
            ':e': error.message
          }
        }).promise();

        await sqs.sendMessage({
          QueueUrl: DLQ_URL,
          MessageBody: JSON.stringify({ taskId, answer, error: error.message })
        }).promise();

        console.error(`Task ${taskId} failed permanently: ${error.message}`);
      }
    }
  }

  return { statusCode: 200 };
};
