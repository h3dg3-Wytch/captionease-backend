import { lambdaWrapper } from "../../../utils/handler-wrapper";
import getConfig from "../../../utils/config";

import customConfig from './config';

import { createDynamoDbClient } from "../../../utils/aws/dynamodb";
import { createS3Client } from "../../../utils/aws/s3";

const createClients = (config: any) => ({
  s3: createS3Client(),
  db: createDynamoDbClient() 
});

async function encodeCaptions(event, { logger }) {
  const config = getConfig(customConfig);

  const clients = createClients(config);

  const eventRecord = event.Records && event.Records[0];

  const key = eventRecord.s3.object.key.split('.')[0];

  logger.info(`Transcription Key: ${key}`);

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
