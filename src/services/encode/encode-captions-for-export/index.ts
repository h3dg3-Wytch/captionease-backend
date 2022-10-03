import { lambdaWrapper } from "../../../utils/handler-wrapper";
import getConfig from "../../../utils/config";

import customConfig from './config';

import { createDynamoDbClient } from "../../../utils/aws/dynamodb";
import { createS3Client } from "../../../utils/aws/s3";
import { getSSMParameter } from "../../../utils/aws/ssm";
import cleanOutTmp from "../../../utils/clean-out-tmp";
import childProcess from 'child_process';

import fs from "fs";
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

    const key = eventRecord.s3.object.key;
    const transcriptionId = key.split('.')[0];

    logger.info(`Transcription Key: ${key}`);

    const params = await Promise.all(['central/s3/videoTranscriptionBucket','central/s3/videoEncodedBucket', 'central/s3/videoInputBucket', 'central/s3/videoOutputBucket'].map( async (bucket) => await getSSMParameter({parameterName: bucket, env})));

    const [videoTranscriptionBucket, videoEncodedBucket, videoInputBucket, videoOutputBucket ] = params;

    const { Items } = await clients.db.search({filters: { attr: "transcriptionKey", eq: transcriptionId}});
    const record = Items[0];

    const videoBucketKey = record?.videoBucketKey;

    logger.info(videoBucketKey);

    const videoBlob = await clients.s3.get({ bucket: videoInputBucket!, key: videoBucketKey});
		const videoBody = videoBlob?.Body;

    logger.info(videoBody);

    const videoKeyName = `/tmp/input.mp4`;

    fs.writeFileSync(videoKeyName, videoBody);

    const subtitlesBlob = await clients.s3.get({ bucket: videoTranscriptionBucket!, key})
    const subtitlesBody = subtitlesBlob?.Body?.toString('utf-8');

    logger.info('subtitles', subtitlesBlob, subtitlesBody)

    const subtitlesKeyName = `/tmp/mov_text.srt`

    const outputKey = '/tmp/output.mp4';

    fs.writeFileSync(subtitlesKeyName,subtitlesBody);

    //ffmpeg -i input.mp4 -map 0 -c copy -c:s mov_text -metadata:s:s:0 language=eng -metadata:s:s:1 language=ipk output.mp4
    // ffmpeg -i infile.mp4 -i infile.srt -c copy -c:s mov_text outfile.mp4

    // ffmpeg -i mymovie.mp4 -vf subtitles=subtitles.srt mysubtitledmovie.mp4

    // ffmpeg -i temp.mp4 -vf "subtitles=temp.srt:force_style='Name=Default,Fontname=Arial,Fontsize=14,PrimaryColour=&Hffffff,SecondaryColour=&Hffffff,OutlineColour=&H44000000BackColour=&H0,BorderStyle=4,Shadow=0'" output-with-subtitles.mp4

    const subtitles = `subtitles=${subtitlesKeyName}:force_style='Name=Default,Fontname=Arial,Fontsize=14,PrimaryColour=&Hffffff,SecondaryColour=&Hffffff,OutlineColour=&H44000000BackColour=&H0,BorderStyle=4,Shadow=0`
    const args = [
      '-i',
      videoKeyName,
      '-vf',
      subtitles,
      outputKey
    ];  

    childProcess.execFileSync("/opt/ffmpeg", args, {});

    const result = fs.readFileSync(outputKey);

    logger.info(`writing to bucket`)

    await clients.s3.put({file: result, bucket: videoOutputBucket!, key: `${transcriptionId}.mp4`})
    logger.info(`result ${outputKey}`);

  }
  catch (error){
    logger.error(error);
    await cleanOutTmp(logger);
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
