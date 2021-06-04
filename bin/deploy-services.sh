#!/bin/bash

set -e

echo "Stage: $STAGE"
echo "AWS Profile: $AWS_PROFILE"

echo "Exporting environment"

set -a
. ".env.$STAGE"
set +a

echo "Building services"

yarn run zip

echo "Deploying: $1"

cdk deploy "$STAGE-$1"

echo "Cleaning assets folder"

find . -name 'asset.*.zip' -print0 | xargs -0 rm

