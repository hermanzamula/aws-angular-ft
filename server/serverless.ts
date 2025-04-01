import type { AWS } from '@serverless/typescript';
import submitTask from '@functions/submitTask';
import getTasks from '@functions/getTasks';
import processTask from '@functions/processTask';
import dlqMonitor from '@functions/dlqMonitor';
import './env';
import * as process from 'node:process';

const DLQ_NAME = 'TaskDLQ';
const TASK_QUEUE_NAME = 'TaskQueue';
const TASK_TABLE_NAME = 'Tasks';

const serverlessConfiguration: AWS = {
  service: 'task-service',
  frameworkVersion: '3',

  plugins: ['serverless-esbuild'],

  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
    region: process.env.AWS_REGION! as AWS['provider']['region'],
    stage: process.env.AWS_STAGE!,
    environment: {
      TASK_TABLE: TASK_TABLE_NAME,
      TASK_QUEUE_URL: {
        Ref: TASK_QUEUE_NAME,
      },
      DLQ_URL: {
        Ref: DLQ_NAME,
      },
    },
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: ['dynamodb:*', 'sqs:*'],
            Resource: '*',
          },
        ],
      },
    },
  },

  functions: {
    submitTask,
    getTasks,
    processTask,
    dlqMonitor,
  },

  package: {
    individually: true,
    excludeDevDependencies: true,
  },

  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      target: 'node20',
      platform: 'node',
      concurrency: 10,
      format: 'cjs',
    },
  },

  resources: {
    Resources: {
      [TASK_QUEUE_NAME]: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: TASK_QUEUE_NAME,
          RedrivePolicy: {
            deadLetterTargetArn: { 'Fn::GetAtt': [DLQ_NAME, 'Arn'] },
            maxReceiveCount: 2,
          },
        },
      },
      [DLQ_NAME]: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: DLQ_NAME,
        },
      },
      TaskTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: TASK_TABLE_NAME,
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'taskId',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'taskId',
              KeyType: 'HASH',
            },
          ],
        },
      },
    },
    Outputs: {
      ApiUrl: {
        Description: 'API Gateway endpoint URL',
        Value: {
          'Fn::Join': [
            '',
            [
              'https://',
              { Ref: 'ApiGatewayRestApi' },
              '.execute-api.${self:provider.region}.amazonaws.com/${self:provider.stage}',
            ],
          ],
        },
        Export: {
          Name: 'TaskServiceApiUrl',
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
