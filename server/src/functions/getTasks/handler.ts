import { APIGatewayProxyHandler } from 'aws-lambda';
import { formatJSONResponse } from '@libs/api-gateway';
import { DynamoDB } from 'aws-sdk';
import { middyfy } from '@libs/lambda';

const dynamo = new DynamoDB.DocumentClient();
const TASK_TABLE = process.env.TASK_TABLE;

const getTasks: APIGatewayProxyHandler = async () => {
  try {
    const result = await dynamo.scan({ TableName: TASK_TABLE }).promise();
    return formatJSONResponse({
      items: result.Items || [],
    });
  } catch (err) {
    console.error('Failed to fetch tasks:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch tasks' }),
    };
  }
};

export const main = middyfy(getTasks);
