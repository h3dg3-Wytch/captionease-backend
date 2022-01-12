
const path = require('path');
const apigateway = require('@aws-cdk/aws-apigateway');
const lambda = require('@aws-cdk/aws-lambda');
const cdk = require('@aws-cdk/core');
const s3 = require('@aws-cdk/aws-s3');
const s3n = require('@aws-cdk/aws-s3-notifications');
const { Duration }= require('@aws-cdk/core');
const sqs = require('@aws-cdk/aws-sqs');
const dynamodb = require('@aws-cdk/aws-dynamodb');
const ssm = require('@aws-cdk/aws-ssm');
const { SqsEventSource, S3EventSource } = require('@aws-cdk/aws-lambda-event-sources');

const createLambdaFunction = require('../../utils/create-lambda-function');
class EncodeService extends cdk.Stack {
  constructor(app, id, { serviceName, stage, env }) {
    super(app, id);

    const bucketNames = ['videoInputBucket', 'audioExtractedBucket', 'videoTranscriptionBucket', 'videoEncodedBucket'];

    const bucketParams = bucketNames.map(name => 
      ssm.StringParameter.fromStringParameterName(this, `import-param-${name}`, `/${process.env.STAGE}/central/s3/${name}`)
    )
 
    const [videoInputBucketParam, audioExtractedBucketParam ,videoTranscriptionBucketParam,videoEncodedBucketParam ] = bucketParams;

    // const videoTranscriptionBucket = s3.Bucket.fromBucketName(this, 'VideoTranscriptionBucket', `development-storage-videotranscriptionsbucket52f9-1d74a0yn98fpu`);

    const ffmpegLayer = new lambda.LayerVersion(this, 'ffmpeg-layer', {
      compatibleRuntimes: [
        lambda.Runtime.NODEJS_10_X,
        lambda.Runtime.NODEJS_12_X,
        lambda.Runtime.NODEJS_14_X,
      ],
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../../layers/ffmpeg.zip')),
      description: 'ffmpeg use for lambda',
    });

    const encodeCaptionsLambda = createLambdaFunction({
      app: this,
      id: 'EncodeCaptionsLambda',
      functionName: 'encodeCaptionsLambda',
      codeAssetPath: path.resolve(__dirname, '../../../build/encode-captions-for-export.zip'),
      handler: "encode-captions-for-export.handler",
      environment: {
        STAGE: process.env.STAGE,
      },
      layers: [ffmpegLayer]
    });
    
    bucketParams.forEach(param => {
      param.grantRead(encodeCaptionsLambda);
    });

    const videoTranscriptionBucket = s3.Bucket.fromBucketName(this, 'VideoTranscriptionBucket', videoTranscriptionBucketParam.stringValue);
    const videoEncodedBucket = s3.Bucket.fromBucketName(this, 'VideoEncodedBucket', videoEncodedBucketParam.stringValue);
    const videoInputBucket = s3.Bucket.fromBucketName(this, 'VideoInputBucket', videoInputBucketParam.stringValue);

    const videoTable = dynamodb.Table.fromTableName(this, 'DynamoTableVideos', 'development-videos' );

    videoTranscriptionBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(encodeCaptionsLambda));
    videoTranscriptionBucket.grantReadWrite(encodeCaptionsLambda);

    videoInputBucket.grantReadWrite(encodeCaptionsLambda);

    videoEncodedBucket.grantReadWrite(encodeCaptionsLambda);

    videoTable.grantReadWriteData(encodeCaptionsLambda);
  }
}

module.exports = { EncodeService }