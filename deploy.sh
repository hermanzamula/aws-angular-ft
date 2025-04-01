#!/bin/bash
set -e

echo "* Deploying Serverless backend..."
cd server
serverless deploy

echo "* Fetching API Gateway URL..."
apiUrl=$(aws cloudformation describe-stacks \
  --stack-name task-service-dev \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)

echo "* API URL: $apiUrl"

echo "* Updating Angular environment.ts..."
cd ../client
echo "API_URL=$apiUrl" > .env

echo "* Building Angular frontend..."
npm install
npm run build

echo "* Deployment complete!"
