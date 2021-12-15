import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import os from "os";
import { createClient } from '@supabase/supabase-js'

import { lambdaWrapper } from "../../../utils/handler-wrapper";
import getConfig from "../../../utils/config";
import { spawnPromise } from "../../../utils/spawn-promise";

import { createS3Client } from "../../../utils/aws/s3";

import customConfig from './config';
import { generateUUID } from "../../../utils/uuid";
import childProcess from 'child_process';
import cleanOutTmp from "../../../utils/clean-out-tmp";
import { createDynamoDbClient } from "../../../utils/aws/dynamodb";

import SSM from 'aws-sdk/clients/ssm';

const createClients = (config: any) => ({
  s3: createS3Client(),
  db: createDynamoDbClient() 
});

process.env.PATH =
  process.env.PATH + ":" + process.env.LAMBDA_TASK_ROOT + "/bin";

const getExtension = (filename: string) => {
  const ext = path.extname(filename || "").split(".");

  return ext[ext.length - 1];
};

const generateDefaultVideoItem = ({
	videoBucketKey,
}) => ({
	id: '' + generateUUID(),
	userId: ''+ generateUUID(),
	state: 'pending',
	videoBucketKey,
	extractedAudioKey: null,
	transcriptionState: 'pending',
	transcriptionKey: null
})

async function extractAudio(event, { logger }) {
  const config = getConfig(customConfig);

  const { STAGE: env } = config;

  const ssm = new SSM({ region: 'us-east-1' });

  const { Parameter } = await ssm
  .getParameter({
	Name: `/${env}/central/s3/audioExtractedBucket`,
  })
  .promise();

  const audioBucket = Parameter?.Value || ''; 

	const clients = createClients(config);

	try {

		logger.info('inside the extract audio lambda')
		logger.info(JSON.stringify(event));

		const eventRecord = event.Records && event.Records[0];

		const inputBucket = eventRecord.s3.bucket.name;
		const key = eventRecord.s3.object.key;

		logger.info(`Getting bucket, key: ${key} inputBucket: ${inputBucket} `);

		const blob = await clients.s3.get({ bucket: inputBucket, key});
		const body = blob?.Body;

		const item = generateDefaultVideoItem({videoBucketKey: key});

		await clients.db.put(item);

		const videoKeyName = `/tmp/${key}`;
		const audioKeyName = `/tmp/temp.mp3`;

		logger.info('Writing video file to temp...');

		fs.writeFileSync(videoKeyName, body);

		const args = [
			"-i" ,
		   videoKeyName,
		   "-vn",
			audioKeyName
		];

		//replace with mp4 with mp3
		logger.info(`Extracting audio from video :: Video key ${inputBucket}/${key}`);

		childProcess.execFileSync("/opt/ffmpeg", args, {});
// 		
		const audioName = fs.readFileSync(audioKeyName);
		
		logger.info(`audioName:${audioKeyName} Reading audio file...`);


		// audio/video-id/audio.mp3
		// tag the file for additional info

		const audioBucketKeyName = `${item.id}.mp3`

		await clients.s3.put({ file: audioName, bucket: audioBucket, key: audioBucketKeyName });
		logger.info(`audioName:${audioKeyName} Writing audio file to s3 ...`);

		item.extractedAudioKey = audioBucketKeyName as any;

		await clients.db.update(item);
		
	} catch (error) {
		logger.error(error);
		throw error;
	}
	cleanOutTmp(logger);
}

const options = {
  name: "extract-audio",
};

export const handler = lambdaWrapper(
  async (event, context) => extractAudio(event, context),
  options
);
