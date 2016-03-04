# Usage run.sh <version> <alias>

set -e
docker rm -f app-$1 || true
docker run --net isaac --net-alias app-$2 --name app-$1 isaac-app-$1
