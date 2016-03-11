grunt dist
docker build -t isaac-app-$1 --build-arg API_VERSION=$2 .
