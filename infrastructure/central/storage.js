const cdk = require('@aws-cdk/core');
const s3 = require('@aws-cdk/aws-s3');

class Storage extends cdk.Stack {
  constructor(app, id, { stage }) {
    super(app, id);

    new s3.Bucket(this, 'VideoInputBucket', {
      name: `video-input-bucket-${stage}`
    });

    new s3.Bucket(this, 'AudioExtractedBucket', {
      name: `audio-extracted-bucket-${stage}`
    });
    
    new s3.Bucket(this, 'VideoTranscriptionsBucket', {
      name: `video-transcriptions-bucket-${stage}`
    });

    new s3.Bucket(this, 'VideoEncodedBucket', {
      name: `video-encoded-bucket-${stage}`
    });
  }
}

module.exports = { Storage };