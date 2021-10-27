
const path = require('path');
const apigateway = require('@aws-cdk/aws-apigateway');
const lambda = require('@aws-cdk/aws-lambda');
const cdk = require('@aws-cdk/core');
const s3 = require('@aws-cdk/aws-s3');
const s3n = require('@aws-cdk/aws-s3-notifications');
const sqs = require('@aws-cdk/aws-sqs');
const { S3EventSource } = require('@aws-cdk/aws-lambda-event-sources');


const createLambdaFunction = require('../../utils/create-lambda-function');

class TranscribeService extends cdk.Stack {
  constructor(app, id, { serviceName, stage, env }) {
    super(app, id);
//video input bucket
  const videoInputBucket = new s3.Bucket(this, 'VideoInputBucket');
  // extracted audio bucket
  const extractAudioBucket = new s3.Bucket(this, 'ExtractAudioBucket');

  const ffmpegLayer = new lambda.LayerVersion(this, 'ffmpeg-layer', {
    compatibleRuntimes: [
      lambda.Runtime.NODEJS_10_X,
      lambda.Runtime.NODEJS_12_X,
      lambda.Runtime.NODEJS_14_X,
    ],
    code: lambda.Code.fromAsset(path.resolve(__dirname, '../../layers/ffmpeg.zip')),
    description: 'ffmpeg use for lambda',
  });

  // video input s3 event source (sqs) queue
  // const videoInputQueue = new cdk.Queue(this, id, );
  // const videoInputQueue = new sqs.Queue(this, 'VideoInputQueue');

  // extract audo sqs queue
  // const audioQueue = new sqs.Queue(this, 'AudioInputQueue');

  // // extract lambda
  const extractAudioLambda = createLambdaFunction({ 
    app: this,
    id: 'ExtractAudioLambda',
    functionName: 'extractAudioLambda',
    codeAssetPath: path.resolve(__dirname, '../../../build/extract-audio.zip'),
    handler: "extract-audio.handler",
    environment: {
      STAGE: process.env.STAGE,
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_API_URL: process.env.SUPABASE_API_URL,
      SUPABASE_API_KEY: process.env.SUPABASE_API_KEY,
      VIDEO_INPUT_BUCKET: videoInputBucket.bucketArn,
      EXTRACTED_VIDEO_AUDIO_BUCKET: extractAudioBucket.bucketArn
    },
    layers: [ffmpegLayer]
  }); 

  videoInputBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(extractAudioLambda))
  videoInputBucket.grantReadWrite(extractAudioLambda);

  

  // extracted audio s3 event source (sqs)
  // extractAudioLambda.addEventSource( new S3EventSource(videoInputBucket, {
  //   events: [s3.EventType.OBJECT_CREATED]
  // }))

  // send transcription job lambda
  const sendTranscriptionLambda = createLambdaFunction({ 
    app: this,
    id: 'sendTranscriptionLambda',
    functionName: 'sendTranscriptionLambda',
    codeAssetPath: path.resolve(__dirname, '../../../build/send-transcribe-job.zip'),
    handler: "send-transcribe-job.handler",
  }); 
  
  extractAudioBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(sendTranscriptionLambda))
  extractAudioBucket.grantReadWrite(extractAudioLambda);
  // sendTranscriptionLambda.addEventSource( new S3EventSource(extractAudioBucket, {
  //   events: [s3.EventType.OBJECT_CREATED]
  // }));

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

<<<<<<< HEAD
    // encode captions lambda
    const encodeCaptionsLambda = createLambdaFunction({ 
      app: this,
      id: 'encodeCaptionsLambda',
      functionName: 'encodeCaptionsLambda',
      codeAssetPath: path.resolve(__dirname, '../../../build/encode-captions-for-export.zip'),
      handler: "encode-captions-for-export.handler",
      environment: { STAGE: stage }
    }); 
=======
  const assemblyWebhookLambda = createLambdaFunction({ 
    app: this,
    id: 'assemblyWebhookLambda',
    functionName: 'assemblyWebhookLambda',
    codeAssetPath: path.resolve(__dirname, '../../../build/assembly-webhook.zip'),
    handler: "assembly-webhook.handler",
  }); 
>>>>>>> c010e2ac54a9e794432a85219b97222b28d2762a

  const assemblyWebhookApiLambdaIntegration = new apigateway.LambdaIntegration(
    assemblyWebhookLambda // Needs to be created
  );
  assemblyWebhookApi.addMethod('GET', assemblyWebhookApiLambdaIntegration);
  assemblyWebhookApi.addMethod('POST', assemblyWebhookApiLambdaIntegration);

  // assembly event bridge
  const videoTranscriptionBucket = new s3.Bucket(this, 'VideoTranscriptionBucket')

  assemblyWebhookLambda.addEventSource( new S3EventSource(videoTranscriptionBucket, {
    events: [s3.EventType.OBJECT_CREATED]
  }));
  }
}

module.exports = { TranscribeService }