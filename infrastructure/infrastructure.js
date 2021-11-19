#!/usr/bin/env node

const dotenv = require("dotenv");

dotenv.config();

const cdk = require("@aws-cdk/core");

const { Dynamo } = require("./central/dynamodb");

const { EncodeService } = require("./services/encode");
const { TranscribeService } = require("./services/transcribe");
const { Storage } = require('./central/storage');
const { CentralStack } = require('./central/central');

console.log(process.env.AWS_ACCESS_KEY_ID)

const app = new cdk.App();

const stage = process.env.STAGE;

const isDevelopment = stage !== "production";

const env = {
  account: process.env.AWS_ACCESS_KEY_ID,
  region: "us-east-1",
  isDevelopment,
};

// Central
// new Dynamo(app, `${stage}-Dynamo`, {
//   serviceName: "dynamo",
//   env,
//   stage,
// });
// new Storage(app, `${stage}-Storage`, {
//   serviceName: "storage",
//   env,
//   stage
// });

// // Services
// new EncodeService(app, `${stage}-EncodeService`, {
//   serviceName: "encode",
//   env,
//   stage,
//   dependencies: {},
// });

// new TranscribeService(app, `${stage}-TranscribeService`, {
//   serviceName: "transcribe",
//   env,
//   stage,
//   dependencies: {},
// });

new CentralStack(app, `captionese-central-stack-${stage}`, {
  env, 
  stage, 
  dependencies: {}
})


app.synth();
