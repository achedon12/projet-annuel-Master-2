FROM php:8.3-fpm

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libicu-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
    zip \
    intl \
    gd \
    pdo_mysql \
    opcache \
    && apt-get clean

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# ALLOW_SUPERUSER is required, not just cosmetic: as root Composer silently
# disables plugins, and symfony/runtime is a plugin — without it the
# post-autoload-dump hook never writes vendor/autoload_runtime.php and every
# bin/console call dies with "Symfony Runtime is missing".
ENV COMPOSER_HOME=/tmp/composer
ENV COMPOSER_ALLOW_SUPERUSER=1

# Deps are installed from the lock file before the app code is copied, so a
# code-only change reuses this layer. --no-scripts because auto-scripts run
# cache:clear, which needs the app code that isn't here yet.
COPY composer.json composer.lock symfony.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY . .

# Warm the prod cache at build time, not on the first request. Matches the
# APP_ENV the compose file sets at runtime.
ENV APP_ENV=prod
ENV APP_DEBUG=0

# Plugins enabled here so symfony/runtime generates vendor/autoload_runtime.php.
RUN composer dump-autoload --no-dev --optimize --classmap-authoritative \
    && composer run-script post-install-cmd --no-dev \
    && chown -R www-data:www-data /var/www/html

USER www-data

CMD ["php-fpm"]
