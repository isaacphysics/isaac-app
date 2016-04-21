#! /bin/bash

set -e # Exit on failure

if test -z "$1"; then
  read -p "isaac-app version to build (e.g. v1.3.0 or 'master'):" VERSION_TO_DEPLOY
else
  VERSION_TO_DEPLOY="$1"
fi

BUILD_DIR=/tmp/isaacDeploy

echo Building in $BUILD_DIR

rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR
cd $BUILD_DIR

git clone -b $VERSION_TO_DEPLOY --depth 1 https://github.com/ucam-cl-dtg/isaac-app.git
cd isaac-app

if test -z "$2"; then
    # If there is no second arg, use SEGUE VERSION from the app src
    SEGUE_VERSION=`grep urlPrefix\(\"/api/ < app/js/app/app.js | sed 's/.*\/api\/\([^\/]*\)\/api.*/\1/g'`
else
    # Otherwise, override the SEGUE_VERSION in the app src to use the specified ref.
    SEGUE_VERSION=$2

    sed -i.bak "s/api\/[^\/]*\/api/api\/$SEGUE_VERSION\/api/g" app/js/app/app.js
    rm app/js/app/app.js.bak
fi

npm install
grunt dist
docker build -t "isaac-app-${VERSION_TO_DEPLOY,,}" --build-arg API_VERSION=$SEGUE_VERSION .

cd ..
rm -rf isaac-app

git clone -b $SEGUE_VERSION --depth 1 https://github.com/ucam-cl-dtg/isaac-api.git
cd isaac-api

docker build -t isaac-api-$SEGUE_VERSION .

cd ..
rm -rf isaac-api
echo "Build complete"
echo "Now run, for example:"
echo "   compose-release $VERSION_TO_DEPLOY dev up"
