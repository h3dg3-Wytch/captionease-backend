const cdk = require('@aws-cdk/core');
const s3 = require('@aws-cdk/aws-s3');

const StorageStack = (props) => {
  const { stage, scope } = props;

  const videoInputBucket = new s3.Bucket(scope, 'VideoInputBucket', {
    name: `video-input-bucket-${stage}`
  });

  const audioExtractedBucket = new s3.Bucket(scope, 'AudioExtractedBucket', {
    name: `audio-extracted-bucket-${stage}`
  });
  
  const videoTranscriptionBucket = new s3.Bucket(scope, 'VideoTranscriptionsBucket', {
    name: `video-transcriptions-bucket-${stage}`
  });

  const videoEncodedBucket = new s3.Bucket(scope, 'VideoEncodedBucket', {
    name: `video-encoded-bucket-${stage}`
  });

  return {
    videoInputBucket, 
    audioExtractedBucket,
    videoTranscriptionBucket,
    videoEncodedBucket
  }
}

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


module.exports = { Storage, StorageStack };