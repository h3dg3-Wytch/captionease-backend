
const path = require('path');
const apigateway = require('@aws-cdk/aws-apigateway');
const lambda = require('@aws-cdk/aws-lambda');
const cdk = require('@aws-cdk/core');
const { Duration }= require('@aws-cdk/core');
const sqs = require('@aws-cdk/aws-sqs');
const { SqsEventSource, S3EventSource } = require('@aws-cdk/aws-lambda-event-sources');
const s3 = require('@aws-cdk/aws-s3');

const createLambdaFunction = require('../../utils/create-lambda-function');

class TranscribeService extends cdk.Stack {
  constructor(app, id, { serviceName, stage, env }) {
    super(app, id);

    // Encode captions dsqs queue
    const encodeCaptionsQueue = new sqs.Queue(this, 'encodeCaptionsQueue', {
      visibilityTimeout: Duration.seconds(180) 
    });

    // encode captions lambda
    const encodeCaptionsLambda = createLambdaFunction({ 
      app: this,
      id: 'encodeCaptionsLambda',
      functionName: 'encodeCaptionsLambda',
      codeAssetPath: path.resolve(__dirname, '../../../build/encode-captions-for-export.zip'),
      handler: "encode-captions-for-export.handler",
      environment: { STAGE: stage }
    }); 

    // encode video bucket 
    const videoInputBucket = new s3.Bucket(this, 'VideoInputBucket');

    encodeCaptionsLambda.addEventSource(new SqsEventSource(encodeCaptionsQueue));
    encodeCaptionsLambda.addEventSource( new S3EventSource(videoInputBucket, {
      events: [s3.EventType.OBJECT_CREATED]
    }))

  }
}

module.exports = { TranscribeService }