
const path = require('path');
const apigateway = require('@aws-cdk/aws-apigateway');
const lambda = require('@aws-cdk/aws-lambda');
const cdk = require('@aws-cdk/core');
const s3 = require('@aws-cdk/aws-s3');
const s3n = require('@aws-cdk/aws-s3-notifications');
const { Duration }= require('@aws-cdk/core');
const sqs = require('@aws-cdk/aws-sqs');
const { SqsEventSource, S3EventSource } = require('@aws-cdk/aws-lambda-event-sources');
const s3 = require('@aws-cdk/aws-s3');

const createLambdaFunction = require('../../utils/create-lambda-function');
class EncodeService extends cdk.Stack {
  constructor(app, id, { serviceName, stage, env }) {
    super(app, id);

    // TODO
  }
}

module.exports = { EncodeService }