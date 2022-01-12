
const path = require('path');
const apigateway = require('@aws-cdk/aws-apigateway');
const lambda = require('@aws-cdk/aws-lambda');
const cdk = require('@aws-cdk/core');
const s3 = require('@aws-cdk/aws-s3');
const s3n = require('@aws-cdk/aws-s3-notifications');
const { Duration }= require('@aws-cdk/core');
const sqs = require('@aws-cdk/aws-sqs');
const dynamodb = require('@aws-cdk/aws-dynamodb');
const { SqsEventSource, S3EventSource } = require('@aws-cdk/aws-lambda-event-sources');

const createLambdaFunction = require('../../utils/create-lambda-function');
class EncodeService extends cdk.Stack {
  constructor(app, id, { serviceName, stage, env }) {
    super(app, id);

    const videoTranscriptionBucket = s3.Bucket.fromBucketName(this, 'VideoTranscriptionBucket', `development-storage-videotranscriptionsbucket52f9-1d74a0yn98fpu`);
    const videoEncodedBucket = s3.Bucket.fromBucketName(this, 'VideoEncodedBucket', 'development-storage-videoencodedbucket1b0da95a-3ylnsk9fbzam');

    const videoTable = dynamodb.Table.fromTableName(this, 'DynamoTableVideos', 'development-videos' );

    const encodeCaptionsLambda = createLambdaFunction({
      app: this,
      id: 'EncodeCaptionsLambda',
      functionName: 'encodeCaptionsLambda',
      codeAssetPath: path.resolve(__dirname, '../../../build/encode-captions-for-export.zip'),
      handler: "encode-captions-for-export.handler",
      environment: {
        STAGE: process.env.STAGE,
      }
    });

    videoTranscriptionBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(encodeCaptionsLambda));
    videoTranscriptionBucket.grantReadWrite(encodeCaptionsLambda);

    videoEncodedBucket.grantReadWrite(encodeCaptionsLambda);

    videoTable.grantReadWriteData(encodeCaptionsLambda);
  }
}

module.exports = { EncodeService }