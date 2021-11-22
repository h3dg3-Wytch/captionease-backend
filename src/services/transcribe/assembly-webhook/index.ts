import { lambdaWrapper } from "../../../utils/handler-wrapper";
import getConfig from "../../../utils/config";

import customConfig from './config';

async function assemblyWebhook(event, { logger }) {
  const config = getConfig(customConfig);
  logger.info('in the assembly webhook', event);

  logger.info(
    `Assembly webhook working :: ${config.STAGE}`
  );

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
