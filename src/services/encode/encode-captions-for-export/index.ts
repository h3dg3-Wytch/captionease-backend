import { lambdaWrapper } from "../../../utils/handler-wrapper";
import getConfig from "../../../utils/config";

import customConfig from './config';

import { createDynamoDbClient } from "../../../utils/aws/dynamodb";
import { createS3Client } from "../../../utils/aws/s3";
import { getSSMParameter } from "../../../utils/aws/ssm";
import cleanOutTmp from "../../../utils/clean-out-tmp";

const createClients = (config: any) => ({
  s3: createS3Client(),
  db: createDynamoDbClient() 
});

async function encodeCaptions(event, { logger }) {
  const config = getConfig(customConfig);

  const { STAGE: env } = config;

  const clients = createClients(config);

  try {
    const eventRecord = event.Records && event.Records[0];

    const key = eventRecord.s3.object.key.split('.')[0];

    logger.info(`Transcription Key: ${key}`);

    const params = await Promise.all(['central/s3/videoTranscriptionBucket','central/s3/videoEncodedBucket'].map( async (bucket) => await getSSMParameter({bucket, env})));

    const [videoTranscriptionBucket, videoEncodedBucket] = params;
    logger.info(`Buckets ${videoTranscriptionBucket} ${videoEncodedBucket}`);


  }
  catch (error){
    logger.error(error);
		throw error;
  }

  await cleanOutTmp(logger);

  return logger.info(
    `Encode captions working :: ${config.STAGE}`
  );
}

const options = {
  name: "encode-captions-for-export",
};

export const handler = lambdaWrapper(
  async (event, context) => encodeCaptions(event, context),
  options
);
