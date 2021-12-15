
const path = require('path');
const apigateway = require('@aws-cdk/aws-apigateway');
const lambda = require('@aws-cdk/aws-lambda');
const cdk = require('@aws-cdk/core');
const s3 = require('@aws-cdk/aws-s3');
const s3n = require('@aws-cdk/aws-s3-notifications');
const sqs = require('@aws-cdk/aws-sqs');
const ssm = require('@aws-cdk/aws-ssm');
const dynamodb = require('@aws-cdk/aws-dynamodb');
const { S3EventSource } = require('@aws-cdk/aws-lambda-event-sources');
const { createSsmParameters } = require('../../utils/ssm')


const createLambdaFunction = require('../../utils/create-lambda-function');

class TranscribeService extends cdk.Stack {
  constructor(app, id, { serviceName, stage, env }) {
    super(app, id);

    // A user uploads a video
    const videoInputBucket = s3.Bucket.fromBucketName(this, 'VideoInputBucket', `development-storage-videoinputbucket940f4f43-1du1ixen5jp8u`);
    const extractedAudioBucket = s3.Bucket.fromBucketName(this, 'AudioExtractedBucket', `development-storage-audioextractedbuckete38bcdcf-10n4xngbp78mz`);
    const videoTranscriptionBucket = s3.Bucket.fromBucketName(this, 'VideoTranscriptionBucket', `development-storage-videotranscriptionsbucket52f9-1d74a0yn98fpu`);

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

    console.log(process.env.ASSEMBLY_AI_KEY);

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
    // attach a token and then use the token is cool? the video string and then a secret token ?

    const apiGatewayName = `assembly-${stage}-webhook`;

    const api = new apigateway.RestApi(this, 'ApiGatewayForApiService', {
      restApiName: apiGatewayName,
      deployOptions: { stageName: stage },
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Cache-Control',
          ...apigateway.Cors.DEFAULT_HEADERS
        ],
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true,
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        proxy: false
      },
    });

    const assemblyWebhookApi = api.root.addResource('webhook');

    const assemblyWebhookLambda = createLambdaFunction({ 
      app: this,
      id: 'assemblyWebhookLambda',
      functionName: 'assemblyWebhookLambda',
      codeAssetPath: path.resolve(__dirname, '../../../build/assembly-webhook.zip'),
      handler: "assembly-webhook.handler",
      environment: {
        STAGE: process.env.STAGE,
      }
    }); 

    assemblyWebhookApi.addMethod(
      'POST',
      new apigateway.LambdaIntegration(assemblyWebhookLambda),
    )
    assemblyWebhookApi.addMethod(
      'GET',
      new apigateway.LambdaIntegration(assemblyWebhookLambda),
    )

    videoTranscriptionBucket.grantReadWrite(assemblyWebhookLambda);




// // Usage
  const apiGatewayUrl = createSsmParameters({
      scope: this,
      envName: process.env.STAGE,
      keyValues: {
        '/services/api/apiUrl': `${api.url}webhook`,
      },
  });

  const consumers = [extractAudioLambda, assemblyWebhookLambda, sendTranscriptionLambda];

  Object.keys(apiGatewayUrl).forEach(key => { 
    const param = ssm.StringParameter.fromStringParameterAttributes(
      this,
      'imported-param-1',
      {
        parameterName: `/${process.env.STAGE}${key}`,
        simpleName: false,
      },
    );
    param.grantRead(assemblyWebhookLambda);
    param.grantRead(sendTranscriptionLambda);
  });

  const bucketNames = ['videoInputBucket', 'audioExtractedBucket', 'videoTranscriptionBucket', 'videoEncodedBucket'];

  const bucketParams = bucketNames.map(name => 
    ssm.StringParameter.fromStringParameterName(this, `import-param-${name}`, `/${process.env.STAGE}/central/s3/${name}`)
  )

  bucketParams.forEach(param => {
    consumers.forEach(consumer => param.grantRead(consumer))
  });

  const apiTokens = [`/${process.env.STAGE}/services/api/assemblyAiToken`].map(url=> 
    ssm.StringParameter.fromStringParameterName(this, `import-param-token`, url)
  );

  apiTokens.forEach(param => {
    consumers.forEach(consumer => param.grantRead(consumer))
  })

  consumers.forEach(consumer => videoTable.grantReadWriteData(consumer));

  }
}

module.exports = { TranscribeService }