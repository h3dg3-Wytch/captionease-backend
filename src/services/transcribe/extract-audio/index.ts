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

const createClients = (config: any) => ({
  s3: createS3Client(),
  supabase: createClient(config.SUPABASE_API_URL, config.SUPABASE_API_KEY),
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

		logger.info(`Extracting audio from video :: Video key ${inputBucket}/${key}`);

		// check video exists and is not deleted
		const { data, error } = await clients.supabase
			.from('Video')
			.select('id, isDeleted, state')
			.eq('id', '123');

		if (error) {
			throw new Error(`Failed to retrive video upload :: ${error.message}`)
		}

		logger.info(`Retrieved video ${data}`);

		// compress video
		// split video into audio
		// create audioKey
		// store audio in s3
		// update video record with audio key

		// 	id = context.awsRequestId,
		// 	resultKey = key.replace(/\.[^.]+$/, EXTENSION),
		// 	workdir = os.tmpdir(),
		// 	inputFile = path.join(workdir,  id + path.extname(key)),
		// 	outputFile = path.join(workdir, id + EXTENSION);

		// return s3Util.downloadFileFromS3(inputBucket, key, inputFile)
		// 	.then(() => childProcessPromise.spawn(
		// 		'/opt/bin/ffmpeg',
		// 		['-loglevel', 'error', '-y', '-i', inputFile, '-vf', `thumbnail,scale=${THUMB_WIDTH}:-1`, '-frames:v', '1', outputFile],
		// 		{
		//       env: process.env, 
		//       cwd: workdir
		//     }
		// 	))
		// 	.then(() => s3Util.uploadFileToS3(OUTPUT_BUCKET, resultKey, outputFile, MIME_TYPE));

	} catch (error) {
		logger.error(error.message);

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
