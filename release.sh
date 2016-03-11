#! /bin/bash

set -e # Exit on failure

read -p "isaac-app version to deploy (e.g. v1.3.0 or for a SNAPSHOT build type 'master'):" VERSION_TO_DEPLOY


BUILD_DIR=/tmp/isaacDeploy

echo Building in $BUILD_DIR

rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR
cd $BUILD_DIR

git clone -b $VERSION_TO_DEPLOY --depth 1 https://github.com/ucam-cl-dtg/isaac-app.git
cd isaac-app

# Determine segue version to use. Honest.
if [[ $VERSION_TO_DEPLOY == v* ]]; then
	SEGUE_VERSION=`grep urlPrefix\(\"/api/ < app/js/app/app.js | sed 's/.*\/api\/\([^\/]*\)\/api.*/\1/g'`
else
	# Change the app src to request the API from a particular branch
	read -p "Override API version to target [$VERSION_TO_DEPLOY]" SEGUE_VERSION
	SEGUE_VERSION=${SEGUE_VERSION:-$VERSION_TO_DEPLOY}

	sed -i.bak "s/api\/[^\/]*\/api/api\/$SEGUE_VERSION\/api/g" app/js/app/app.js
	rm app/js/app/app.js.bak
fi

npm install
./build.sh "${VERSION_TO_DEPLOY,,}" $SEGUE_VERSION


cd ..
rm -rf isaac-app

git clone -b $SEGUE_VERSION --depth 1 https://github.com/ucam-cl-dtg/isaac-api.git
cd isaac-api

./build.sh $SEGUE_VERSION

cd ..
rm -rf isaac-api
echo "Build complete"
echo "Now run, for example:"
echo "   compose-release $VERSION_TO_DEPLOY dev up"
