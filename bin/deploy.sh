#!/bin/bash

set -e

function testDependency() {

  local CMD="${1}"
  local CMD_PATH="$(which "${CMD}")"

  if ! ([ -f "${CMD_PATH}" ] && [ -x "${CMD_PATH}" ]); then
    echo "Can't find \"${CMD}\" which is a required dependency. brew install \"${CMD}\""
    exit 1
  fi
}

testDependency aws-vault
testDependency jq
testDependency perl
testDependency yarn
testDependency aws

HERE=$(dirname $0)
cd "${HERE}/.."
ABSOLUTE_ROOT=$(pwd)

echo "Stage: $STAGE"
echo "AWS Profile: $AWS_PROFILE"

SERVICES="$(jq -r '."services" | select(. != null) | keys[]' infrastructure/config.json)"
SERVICE_STACKS="$(jq '.services[].stack' infrastructure/config.json | jq -s )"

echo "Packaging up services"

yarn run zip

echo "Applying infrastructure"

cdk synth

echo "Exporting environment"

set -a
. ".env.$STAGE"
set +a

echo "Core Stacks applied succesfully ✅"

for SERVICE_STACK in ${SERVICE_STACKS}
do
  if [ "$SERVICE_STACK" == "[" ]
  then
    echo "----"
  elif [ "$SERVICE_STACK" == "]" ]
  then
    echo "----"
  else
    FORMAT="${SERVICE_STACK//\"}"
    SERVICE="${FORMAT//,}"
    echo "Deploying: $SERVICE"

    cdk deploy "$STAGE-$SERVICE"
  fi
done

echo "Service Stacks applied succesfully ✅"

echo "Cleaning assets folder"

find . -name 'asset.*.zip' -print0 | xargs -0 rm

echo "✅ Infrastructure deployment complete"
