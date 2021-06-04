const cdk = require('@aws-cdk/core');
const { Function, Code, Runtime } = require('@aws-cdk/aws-lambda');

const createLambdaFunction = ({
  app,
  id,
  functionName,
  codeAssetPath,
  handler,
  memorySize = 521,
  timeout,
  layers,
  environment
}) =>
  new Function(app, id, {
    functionName,
    code: Code.fromAsset(codeAssetPath),
    handler,
    runtime: Runtime.NODEJS_10_X,
    memorySize,
    timeout: timeout || cdk.Duration.seconds(60),
    layers,
    environment
  });

module.exports = createLambdaFunction;
