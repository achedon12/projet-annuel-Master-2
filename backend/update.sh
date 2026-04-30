#!/bin/bash

set -e

composer install

#php bin/console doctrine:migrations:migrate --no-interaction

exec "$@"