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

const createClients = (config: any) => ({
  s3: createS3Client(),
});

process.env.PATH =
  process.env.PATH + ":" + process.env.LAMBDA_TASK_ROOT + "/bin";

const getExtension = (filename: string) => {
  const ext = path.extname(filename || "").split(".");

  return ext[ext.length - 1];
};

async function extractAudio(event, { logger }) {
  const config = getConfig(customConfig);

	const clients = createClients(config);
	

	try {

		logger.info('inside the extract audio lambda')
		logger.info(JSON.stringify(event));

		const eventRecord = event.Records && event.Records[0];

		const id = generateUUID();
		const inputBucket = eventRecord.s3.bucket.name;
		const key = eventRecord.s3.object.key;

		logger.info(`Getting bucket, key: ${key} inputBucket: ${inputBucket} `);

		const blob = await clients.s3.get({ bucket: inputBucket, key});
		const body = blob?.Body;

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
		const audioBucket = 'development-storage-audioextractedbuckete38bcdcf-10n4xngbp78mz';

		const audioName = fs.readFileSync(audioKeyName);
		
		fs.readdirSync('/tmp/').forEach(file => {
			logger.info(`opt: ${file}`);
		});
		
		logger.info(`audioName:${audioKeyName} Reading audio file...`);

		await clients.s3.put({ file: audioName, bucket: audioBucket, key: `${uuidv4()}-temp.mp3`});
		logger.info(`audioName:${audioKeyName} Writing audio file to s3 ...`);
		
		cleanOutTmp(logger);
		
	} catch (error) {
		logger.error(error);
		cleanOutTmp(logger);
    throw error;
	}
}

const options = {
  name: "extract-audio",
};

export const handler = lambdaWrapper(
  async (event, context) => extractAudio(event, context),
  options
);
