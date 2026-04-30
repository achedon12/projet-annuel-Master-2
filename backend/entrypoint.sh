#!/bin/bash

set -e

./update.sh

chmod -R 777 /var/www/html/var
chmod -R 777 /var/www/html/public/uploads

exec "$@"