import { DynamoDB, SQS } from 'aws-sdk';
import { formatJSONResponse, ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import schema from './schema';
import { Task } from '../../../../shared/models/task';

const dynamo = new DynamoDB.DocumentClient();
const sqs = new SQS();

const TABLE_NAME = process.env.TASK_TABLE as string;
const QUEUE_URL = process.env.TASK_QUEUE_URL as string;

const submitTask: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  const { taskId, answer } = event.body;

  const taskItem: Task = {
    taskId,
    answer,
    status: 'Pending',
    retries: 0,
    errorMessage: ''
  };

  try {
    // 1. Save task to DynamoDB
    await dynamo.put({
      TableName: TABLE_NAME,
      Item: taskItem
    }).promise();

    // 2. Send task to SQS
    await sqs.sendMessage({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify({ taskId, answer })
    }).promise();

    return formatJSONResponse({
      message: `Submitted task ${taskId} with answer: ${answer}`
    });
  } catch (error) {
    console.error('Submit task failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to submit task', error: error.message })
    };
  }
};

export const main = middyfy(submitTask);
