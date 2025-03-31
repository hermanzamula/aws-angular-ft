const DotenvSafe = require('dotenv-safe');

DotenvSafe.config({
  example: '.env.example',
  allowEmptyValues: false
});

const DotenvWebpack = require('dotenv-webpack');

module.exports = {
  plugins: [
    new DotenvWebpack({
      path: './.env',
      safe: true
    })
  ]
};
