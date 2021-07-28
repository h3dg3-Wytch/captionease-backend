#!/usr/bin/env node

const dotenv = require("dotenv");

dotenv.config();

const cdk = require("@aws-cdk/core");

const { Dynamo } = require("./central/dynamodb");

const { EncodeService } = require("./services/encode");
const { TranscribeService } = require("./services/transcribe");

const app = new cdk.App();

const stage = process.env.STAGE;

const isDevelopment = stage !== "production";

const env = {
  account: process.env.AWS_ACCOUNT_ID,
  region: "us-east-1",
  isDevelopment,
};

// Central
new Dynamo(app, `${stage}-Dynamo`, {
  serviceName: "dynamo",
  env,
  stage,
});

// Services
new EncodeService(app, `${stage}-EncodeService`, {
  serviceName: "encode",
  env,
  stage,
  dependencies: {},
});

new TranscribeService(app, `${stage}-TranscribeService`, {
  serviceName: "transcribe",
  env,
  stage,
  dependencies: {},
});

app.synth();
