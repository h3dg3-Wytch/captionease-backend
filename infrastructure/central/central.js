const { StorageStack } = require('./storage');

const { Dynamo } = require("./dynamodb");

const { EncodeService } = require("../services/encode");
const { TranscribeService } = require("../services/transcribe");
const { Storage } = require('./storage');

const cdk = require("@aws-cdk/core");

class CentralStack extends cdk.Stack {

    constructor(scope, id, props) {
        super(scope, id, props);
    
        const {
          env,
          app,
          stage
        } = props;
    
        /**
         *
         * Storage stack
         */
        const {
            videoInputBucket, 
            audioExtractedBucket,
            videoTranscriptionBucket,
            videoEncodedBucket
        } = StorageStack({ scope: this, stage});
    
        // -- create ssm param with  streamableWaveformBucket.bucketName as STREAMABLE_AUDIO_BUCKET_NAME,
        // -- create ssm param with streamableWaveformBucket.bucketArn as STREAMABLE_AUDIO_BUCKET_ARN,
    
        // Retrieve SSM param for lambda environment variables
    
        // const streamableAudioBucketName = StringParameter.fromStringParameterAttributes(scope, `param-${ssmKeys.STREAMABLE_AUDIO_BUCKET_NAME}-${envName}`, {
        //   parameterName: `/${envName}${STREAMABLE_AUDIO_BUCKET_NAME}`,
        //   simpleName: false,
        // });

        // Central
        new Dynamo(app, `${stage}-Dynamo`, {
            serviceName: "dynamo",
            env,
            stage,
        });
        // new Storage(app, `${stage}-Storage`, {
        //     serviceName: "storage",
        //     env,
        //     stage
        // });
        
        // Services
        new EncodeService(app, `${stage}-EncodeService`, {
            serviceName: "encode",
            env,
            stage,
            dependencies: {},
        });
        
        new TranscribeService(app, `${stage}-TranscribeService`, {
            serviceName: "transcribe",
            env,
            stage,
            dependencies: {},
        });
      }
}

module.exports = { CentralStack };