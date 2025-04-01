import type { AWS } from '@serverless/typescript';
import submitTask from '@functions/submitTask';
import getTasks from '@functions/getTasks';
import processTask from '@functions/processTask';
import './env';
import * as process from 'node:process';

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
      TASK_TABLE: 'Tasks',
      TASK_QUEUE_URL: {
        Ref: 'TaskQueue',
      },
      DLQ_URL: {
        Ref: 'TaskDLQ',
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
      TaskQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: 'TaskQueue',
          RedrivePolicy: {
            deadLetterTargetArn: { 'Fn::GetAtt': ['TaskDLQ', 'Arn'] },
            maxReceiveCount: 2,
          },
        },
      },
      TaskDLQ: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: 'TaskDLQ',
        },
      },
      TaskTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: 'Tasks',
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
