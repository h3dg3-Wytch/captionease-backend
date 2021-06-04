import { lambdaWrapper } from "../../../utils/handler-wrapper";
import getConfig from "../../../utils/config";

import customConfig from './config';

async function sendTranscribeJob(event, { logger }) {
  const config = getConfig(customConfig);

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
