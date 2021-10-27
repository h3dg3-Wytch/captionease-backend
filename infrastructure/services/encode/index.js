
const path = require('path');
const apigateway = require('@aws-cdk/aws-apigateway');
const lambda = require('@aws-cdk/aws-lambda');
const cdk = require('@aws-cdk/core');
<<<<<<< HEAD
const s3 = require('@aws-cdk/aws-s3');
const s3n = require('@aws-cdk/aws-s3-notifications');
=======
const { Duration }= require('@aws-cdk/core');
>>>>>>> c010e2ac54a9e794432a85219b97222b28d2762a
const sqs = require('@aws-cdk/aws-sqs');
const { SqsEventSource, S3EventSource } = require('@aws-cdk/aws-lambda-event-sources');
const s3 = require('@aws-cdk/aws-s3');

const createLambdaFunction = require('../../utils/create-lambda-function');

class EncodeService extends cdk.Stack {
  constructor(app, id, { serviceName, stage, env }) {
    super(app, id);

<<<<<<< HEAD
  //video input bucket
  // manually add the acceleration 
  const videoInputBucket = new s3.Bucket(this, 'VideoInputBucket');

  // video input s3 event source (sqs) queue
  // const videoInputQueue = new cdk.Queue(this, id, );
  // const videoInputQueue = new sqs.Queue(this, 'VideoInputQueue');

  // extract audo sqs queue
  // const audioQueue = new sqs.Queue(this, 'AudioInputQueue');

  const ffmpegExecutionLayer = new lambda.LayerVersion(
    this,
    "FFMPEGformLayer",
    {
      code: lambda.Code.fromAsset(
        path.join(
          __dirname,
          "../../layers/ffmpeg.zip"
        )
      ),
      compatibleRuntimes: [lambda.Runtime.NODEJS_12_X],
      description: "Binary file of ffmpeg",
    }
  );
  // // extract lambda
  const extractAudioLambda = createLambdaFunction({ 
    app: this,
    id: 'ExtractAudioLambda',
    functionName: 'extraAudioLambda',
    codeAssetPath: path.resolve(__dirname, '../../../build/extract-audio.zip'),
    handler: "extract-audio.handler",
    environment: { STAGE: stage }
  }); 
  
  // extracted audio bucket
  const extractAudioBucket = new s3.Bucket(this, 'ExtractAudioBucket');

  videoInputBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(extractAudioLambda))
  videoInputBucket.grantReadWrite(extractAudioLambda);

  // send transcription job lambda
  const sendTranscriptionLambda = createLambdaFunction({ 
    app: this,
    id: 'sendTranscriptionLambda',
    functionName: 'sendTranscriptionLambda',
    codeAssetPath: path.resolve(__dirname, '../../../build/send-transcribe-job.zip'),
    handler: "send-transcribe-job.handler",
    environment: { STAGE: stage }
  }); 
  
  extractAudioBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(sendTranscriptionLambda))
  extractAudioBucket.grantReadWrite(extractAudioLambda);

  // assembly webhook api gateway

  const apiGatewayName = `assembly-${stage}-webhook`;

  const api = new apigateway.RestApi(this, 'ApiGatewayForApiService', {
    restApiName: apiGatewayName,
    deployOptions: { stageName: stage },
    failOnWarnings: true,
    proxy: false,
  });

  const assemblyWebhookApi = api.root.addResource('webhook');
  // addCorsOptions(assemblyWebhookApi);

  const assemblyWebhookLambda = createLambdaFunction({ 
    app: this,
    id: 'assemblyWebhookLambda',
    functionName: 'assemblyWebhookLambda',
    codeAssetPath: path.resolve(__dirname, '../../../build/assembly-webhook.zip'),
    handler: "assembly-webhook.handler",
      environment: { STAGE: stage }
  }); 

  const assemblyWebhookApiLambdaIntegration = new apigateway.LambdaIntegration(
    assemblyWebhookLambda // Needs to be created
  );
  assemblyWebhookApi.addMethod('GET', assemblyWebhookApiLambdaIntegration);
  assemblyWebhookApi.addMethod('POST', assemblyWebhookApiLambdaIntegration);

  // assembly event bridge
  const videoTranscriptionBucket = new s3.Bucket(this, 'VideoTranscriptionBucket')
  videoTranscriptionBucket.grantReadWrite(assemblyWebhookLambda);

=======
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
    }); 

    // encode video bucket 
    const videoInputBucket = new s3.Bucket(this, 'VideoInputBucket');

    encodeCaptionsLambda.addEventSource(new SqsEventSource(encodeCaptionsQueue));
    encodeCaptionsLambda.addEventSource( new S3EventSource(videoInputBucket, {
      events: [s3.EventType.OBJECT_CREATED]
    }))
>>>>>>> c010e2ac54a9e794432a85219b97222b28d2762a

  }

}

module.exports = { EncodeService }