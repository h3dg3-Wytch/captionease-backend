import { lambdaWrapper } from "../../../utils/handler-wrapper";
import getConfig from "../../../utils/config";

import customConfig from './config';

async function encodeCaptions(event, { logger }) {
  const config = getConfig(customConfig);

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
