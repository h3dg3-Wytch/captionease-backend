import fs from "fs";
import logger from "./logger";
import path from "path";


export default async function cleanOutTmp(logger) {
    logger.info('cleaning out /tmp');
    await fs.readdir('/tmp/',async (err, files) => {
        if (err) throw err;
        logger.info(files);
        for (const file of files) {
          await fs.unlink(path.join('/tmp/', file), err => {
            if (err) throw err;
          });
        }
      });
}