
const path = require('path');
const apigateway = require('@aws-cdk/aws-apigateway');
const lambda = require('@aws-cdk/aws-lambda');
const cdk = require('@aws-cdk/core');
const s3 = require('@aws-cdk/aws-s3');
const s3n = require('@aws-cdk/aws-s3-notifications');
const sqs = require('@aws-cdk/aws-sqs');
const dynamodb = require('@aws-cdk/aws-dynamodb');
const { S3EventSource } = require('@aws-cdk/aws-lambda-event-sources');


const createLambdaFunction = require('../../utils/create-lambda-function');

class TranscribeService extends cdk.Stack {
  constructor(app, id, { serviceName, stage, env }) {
    super(app, id);

    // A user uploads a video
    const videoInputBucket = s3.Bucket.fromBucketName(this, 'VideoInputBucket', `development-storage-videoinputbucket940f4f43-1du1ixen5jp8u`);
    const extractedAudioBucket = s3.Bucket.fromBucketName(this, 'AudioExtractedBucket', `development-storage-audioextractedbuckete38bcdcf-10n4xngbp78mz`);

    const videoTable = dynamodb.Table.fromTableName(this, 'DynamoTableVideos', 'development-videos' )

    const ffmpegLayer = new lambda.LayerVersion(this, 'ffmpeg-layer', {
      compatibleRuntimes: [
        lambda.Runtime.NODEJS_10_X,
        lambda.Runtime.NODEJS_12_X,
        lambda.Runtime.NODEJS_14_X,
      ],
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../../layers/ffmpeg.zip')),
      description: 'ffmpeg use for lambda',
    });

    // We the extract the audio from it putting into extracted-audio-bucket

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
        EXTRACTED_VIDEO_AUDIO_BUCKET: extractedAudioBucket.bucketArn
      },
      layers: [ffmpegLayer]
    }); 

    videoInputBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(extractAudioLambda))
    videoInputBucket.grantReadWrite(extractAudioLambda);

    extractedAudioBucket.grantReadWrite(extractAudioLambda);

    videoTable.grantReadWriteData(extractAudioLambda);


    // For the extracted audio, dispatch a job to Assembly A.I for transcribining

    const sendTranscriptionLambda = createLambdaFunction({ 
      app: this,
      id: 'sendTranscriptionLambda',
      functionName: 'sendTranscriptionLambda',
      codeAssetPath: path.resolve(__dirname, '../../../build/send-transcribe-job.zip'),
      handler: "send-transcribe-job.handler",
      environment: {
        STAGE: process.env.STAGE,
        ASSEMBLY_AI_KEY: process.env.ASSEMBLY_AI_KEY
      }
    }); 
    
    extractedAudioBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(sendTranscriptionLambda))
    extractedAudioBucket.grantReadWrite(sendTranscriptionLambda);
    // sendTranscriptionLambda.addEventSource( new S3EventSource(extractedAudioBucket, {
    //   events: [s3.EventType.OBJECT_CREATED]
    // }));

    videoTable.grantReadWriteData(sendTranscriptionLambda);


    // assembly webhook api gateway

    const apiGatewayName = `assembly-${stage}-webhook`;

    const api = new apigateway.RestApi(this, 'ApiGatewayForApiService', {
      restApiName: apiGatewayName,
      deployOptions: { stageName: stage },
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true,
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
      },
      failOnWarnings: true,
      proxy: false,
    });

    const assemblyWebhookApi = api.root.addResource('webhook');
    // addCorsOptions(assemblyWebhookApi);
  }
}

module.exports = { TranscribeService }