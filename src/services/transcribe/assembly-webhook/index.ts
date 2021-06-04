import { lambdaWrapper } from "../../../utils/handler-wrapper";
import getConfig from "../../../utils/config";

import customConfig from './config';

async function assemblyWebhook(event, { logger }) {
  const config = getConfig(customConfig);

  return logger.info(
    `Assembly webhook working :: ${config.STAGE}`
  );
}

const options = {
  name: "assembly-webhook",
};

export const handler = lambdaWrapper(
  async (event, context) => assemblyWebhook(event, context),
  options
);
