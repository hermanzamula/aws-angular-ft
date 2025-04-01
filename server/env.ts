import * as fs from 'fs';
import * as path from 'path';
import * as dotenvSafe from 'dotenv-safe';

const envPath = path.resolve(__dirname, '.env');
const examplePath = path.resolve(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  console.warn(`⚠️  .env file not found. Creating one from .env.example...`);
  fs.copyFileSync(examplePath, envPath);
  console.info(`✅  .env created. Please fill in the missing values.`);
}

dotenvSafe.config({
  path: envPath,
  example: examplePath,
  allowEmptyValues: false
});