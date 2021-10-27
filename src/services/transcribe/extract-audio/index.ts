import uuidv4 from "uuid/v4";
import fs from "fs";
import path from "path";
import os from "os";
import { createClient } from '@supabase/supabase-js'

import { lambdaWrapper } from "../../../utils/handler-wrapper";
import getConfig from "../../../utils/config";
import { spawnPromise } from "../../../utils/spawn-promise";

import { createS3Client } from "../../../utils/aws/s3";

import customConfig from './config';

import childProcess from "child_process";

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
		logger.info(JSON.stringify(event));

		const eventRecord = event.Records && event.Records[0];

		const inputBucket = eventRecord.s3.bucket.name;
		const key = eventRecord.s3.object.key;

		logger.info(`Getting bucket, key: ${key} inputBucket: ${inputBucket} `);

		const blob = await clients.s3.get({ bucket: inputBucket, key});
		const body = blob?.Body;

		const videoKeyName = `/tmp/${key}`;
		const audioKeyName = `/tmp/test.mp3`;

		// @ts-ignore
		// defensive check later


		logger.info('Writing video file to temp...');

		
		fs.writeFileSync(videoKeyName, body);

		const args = [
			"-i" ,
		   videoKeyName,
			"-q:a",
			 "0",
			"-map a",
			audioKeyName
		];

		//replace with mp4 with mp3
		logger.info(`Extracting audio from video :: Video key ${inputBucket}/${key}`);

		fs.readdirSync('/opt/').forEach(file => {
			logger.info(`opt: ${file}`);
		});
		
		
		const stout = childProcess.execFileSync("/opt/ffmpeg", args, {});

		// development-encodeservic-videoinputbucket940f4f43-iy9if872u4ib

		const audioBucket = 'development-encodeservic-extractaudiobucket197901-1wjvufyahi68c';

		const audioName = fs.readFileSync(audioKeyName);
		logger.info(`audoName:${audioName} Reading audio file...`);

		clients.s3.put({ file: audioName, bucket: audioBucket, key: audioKeyName });

		// //.... rest of the logic to clear up locally written files from running the executable


		// // compress video
		// // split video into audio
		// // create audioKey
		// // store audio in s3
		// // update video record with audio key

	
	} catch (error) {
		logger.error(error);
		fs.readdir('/tmp/', (err, files) => {
			if (err) throw err;
			
			for (const file of files) {
			  fs.unlink(path.join('/tmp/', file), err => {
				if (err) throw err;
				logger.info(`Deleting ${file}`);
			  });
			}
		});	


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
