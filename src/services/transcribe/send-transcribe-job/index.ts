import { lambdaWrapper } from "../../../utils/handler-wrapper";
import getConfig from "../../../utils/config";



import customConfig from './config';

import axios from 'axios';
import { createS3Client } from "../../../utils/aws/s3";
import { createDynamoDbClient } from "../../../utils/aws/dynamodb";


// Pre-tasks

// Retrieve trial developer key from Assembly.AI
// Look up create job from documentation (https://docs.assemblyai.com/overview/getting-started)
// Lambda Logic

// Create a pre-signed URL that has a one hour expiration time for the audio file extracted from the previous lambda
// Dispatch a new job calling the relevant API endpoint
// Mark video state to transcribing and save transcription job ID to video record


const createClients = (config: any) => ({
  s3: createS3Client(),
  db: createDynamoDbClient() 
});


async function sendTranscribeJob(event, { logger }) {

  const config = getConfig(customConfig);
  const ASSEMBLY_AI_KEY = config.ASSEMBLY_AI_KEY;

  const clients = createClients(config);


  logger.info('inside the transcribe lambda job', JSON.stringify(event));

  const eventRecord = event.Records && event.Records[0];  
  const bucket = eventRecord.s3.bucket.name;
  const filePath = eventRecord.s3.object.key;


  const audioUrl = await clients.s3.generateSignedGetUrl({bucket, filePath });

  logger.info('audio url', audioUrl)

  const webhook_url = await clients.s3.generatePresignedPostUrl({});
  logger.info('webhook url', webhook_url)

  const assemblyAiRepsonse = await  axios({
    method: 'post',
    headers: {authorization: ASSEMBLY_AI_KEY, 'content-type': 'application/json'} ,
    url: 'https://api.assemblyai.com/v2/transcript',
    data: {
      audio_url: audioUrl, 
      webhook_url
    }
  })

  logger.info('response', assemblyAiRepsonse.data);


  return logger.info(
    `Send transcribe job working :: ${config.STAGE}`
  );
}

const options = {
  name: "send-transcribe-job",
};

export const handler = lambdaWrapper(
  async (event, context) => sendTranscribeJob(event, context),
  options
);
