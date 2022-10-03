const cdk = require('@aws-cdk/core');
const s3 = require('@aws-cdk/aws-s3');
const { createSsmParameters } = require('../utils/ssm');

class Storage extends cdk.Stack {
  constructor(app, id, { stage }) {
    super(app, id);

    const videoInputBucket = new s3.Bucket(this, 'VideoInputBucket', {
      name: `video-input-bucket-${stage}`
    });

    const audioExtractedBucket = new s3.Bucket(this, 'AudioExtractedBucket', {
      name: `audio-extracted-bucket-${stage}`
    });
    
    const videoTranscriptionBucket = new s3.Bucket(this, 'VideoTranscriptionsBucket', {
      name: `video-transcriptions-bucket-${stage}`
    });

    const videoEncodedBucket = new s3.Bucket(this, 'VideoEncodedBucket', {
      name: `video-encoded-bucket-${stage}`
    });

    const videoOutputBucket = new s3.Bucket(this, 'VideoOutputBucket', {
      name: `video-output-bucket-${stage}`
    });

    createSsmParameters({
      scope: this, 
      envName: process.env.STAGE,
      keyValues:{
        '/central/s3/videoInputBucket': videoInputBucket.bucketName,
        '/central/s3/audioExtractedBucket': audioExtractedBucket.bucketName,
        '/central/s3/videoTranscriptionBucket': videoTranscriptionBucket.bucketName,
        '/central/s3/videoEncodedBucket': videoEncodedBucket.bucketName,
        '/central/s3/videoOutputBucket': videoOutputBucket.bucketName,
      }
    })
  }
}

module.exports = { Storage };