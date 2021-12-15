import { lambdaWrapper } from "../../../utils/handler-wrapper";
import getConfig from "../../../utils/config";

import customConfig from './config';

import SSM from 'aws-sdk/clients/ssm';
import axios from 'axios';
import { createS3Client } from "../../../utils/aws/s3";
import { createDynamoDbClient } from "../../../utils/aws/dynamodb";


const createClients = (config: any) => ({
  s3: createS3Client(),
  db: createDynamoDbClient() 
});


async function assemblyWebhook(event, { logger }) {
  const config = getConfig(customConfig);
  const clients = createClients(config);

  const { STAGE: env } = config;

  const ssm = new SSM({ region: 'us-east-1' });
  logger.info('in the assembly webhook', event);

  logger.info(
    `Assembly webhook working :: ${config.STAGE}`
  );

  const { Parameter } = await ssm
    .getParameter({
      Name: `/${env}/services/api/assemblyAiToken`,
    })
    .promise();

  const assemblyAiToken = Parameter?.Value || ''; 

  logger.info(assemblyAiToken);

  const { transcript_id: transcriptId } = JSON.parse(event.body);
  logger.info(transcriptId);
   

  const assemblyAiRepsonse = await axios({
    method: 'get',
    headers: {authorization: assemblyAiToken, 'content-type': 'application/json'} ,
    url: `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
  });

  logger.info(JSON.stringify(assemblyAiRepsonse.data));

  if(assemblyAiRepsonse) {
    const { Items } = await clients.db.search({filters: { attr: "transcriptionKey", eq: transcriptId}})
    const record = Items[0];
    await clients.db.update({
      ...record, 
      transcriptionState: 'complete',


    })



  }

  // await clients.s3.put({ file: audioName, bucket: audioBucket, key: audioBucketKeyName }); 
  // const eventRecord = event.Records && event.Records[0];

  // const { body } = eventRecord;

  // condfiguring the 200
  // how I got this working
  //gen a token
  //store that on a dynamo row
  //dispatch the job preprend the video id and then encode it (base64?) happy iron 
  // get the response back you should have in the query that token 
  // decrpty with video id and the token , if the token's match good to go, otherwise throw
  

  return {
    body: JSON.stringify(
      {todoId: 1, text: 'walk the dog 🐕'},
    ),
    statusCode: 200,
  };
}

const options = {
  name: "assembly-webhook"
};

export const handler = lambdaWrapper(
  async (event, context) => assemblyWebhook(event, context),
  options
);
