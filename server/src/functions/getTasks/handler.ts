import { APIGatewayProxyHandler } from 'aws-lambda';
import { formatJSONResponse } from '@libs/api-gateway';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { middyfy } from '@libs/lambda';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamo = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamo);

const TASK_TABLE = process.env.TASK_TABLE;

const getTasks: APIGatewayProxyHandler = async () => {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: TASK_TABLE }));

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
