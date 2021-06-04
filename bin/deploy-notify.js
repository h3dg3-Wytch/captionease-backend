const SlackWebhook = require('slack-webhook');

const slack = new SlackWebhook(process.env.SLACK_DEPLOY_WEBHOOK);

const currentVersion = require('../package.json').version;

async function deployNotify() {
  try {
    const user = process.argv[2];

    return slack.send(
      `${user} has deployed Truman to ${process.env.STAGE}. Current version: ${currentVersion}`
    );
  } catch (error) {
    throw new Error(error);
  }
}

deployNotify();
