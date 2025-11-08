#!/bin/sh
set -e

echo "Waiting for MySQL to be ready..."
sleep 15

echo "MySQL should be ready now, starting application..."
exec "$@"