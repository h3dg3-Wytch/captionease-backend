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

CORE_STACKS="$(jq '.core[].stack' infrastructure/config.json | jq -s )"

echo "Exporting environment"

set -a
. ".env.$STAGE"
set +a

echo "Deploying core infrastructure"

cdk synth

for CORE_STACK in ${CORE_STACKS}
do
  if [ "$CORE_STACK" == "[" ]
  then
    echo "----"
  elif [ "$CORE_STACK" == "]" ]
  then
    echo "----"
  else
    FORMAT="${CORE_STACK//\"}"
    CORE="${FORMAT//,}"
    
    echo "Deploying: $CORE"

    cdk deploy "$STAGE-$CORE"
  fi
done

yarn run deploy:notify

