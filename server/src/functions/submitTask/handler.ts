import { formatJSONResponse, ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import schema from './schema';
import { TaskRequest } from '../../../../shared/models/task';

const dynamo = new DynamoDBClient({});
const sqs = new SQSClient({});

const TABLE_NAME = process.env.TASK_TABLE as string;
const QUEUE_URL = process.env.TASK_QUEUE_URL as string;

const submitTask: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  const { taskId, answer } = event.body as TaskRequest;

  try {
    await dynamo.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          taskId: { S: taskId },
          answer: { S: answer },
          status: { S: 'Pending' },
          retries: { N: '0' },
          errorMessage: { S: '' },
          createdAt: { S: new Date().toISOString() },
        },
      }),
    );

    await sqs.send(
      new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify({ taskId, answer }),
      }),
    );

    return formatJSONResponse({
      message: `Submitted task ${taskId} with answer: ${answer}`,
    });
  } catch (error) {
    console.error('Submit task failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to submit task', error: error.message }),
    };
  }
};

export const main = middyfy(submitTask);
