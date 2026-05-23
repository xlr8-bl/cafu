# Smart Restaurant Web App — PHP-FPM image
# Multi-stage: composer install (build) -> runtime
FROM composer:2.7 AS deps
WORKDIR /app
COPY app/composer.json app/composer.lock* ./
# Dev deps included for now — phpunit/phpcs needed in the dev container.
# When PR4 splits dev/prod targets, the prod stage will re-run with --no-dev.
RUN composer install --no-scripts --no-progress --prefer-dist --optimize-autoloader

FROM php:8.3-fpm-alpine AS runtime

# Pre-built PHP extensions via mlocati/php-extension-installer.
# Avoids pulling gcc/perl/autoconf and compiling from source (saves ~20 min on first build).
COPY --from=mlocati/php-extension-installer:2 /usr/bin/install-php-extensions /usr/local/bin/
RUN apk add --no-cache icu-libs libzip oniguruma \
    && install-php-extensions pdo_mysql mysqli intl zip opcache \
    && rm -rf /var/cache/apk/*

# Composer in the runtime so `composer test / lint` works inside the container.
COPY --from=composer:2.7 /usr/bin/composer /usr/local/bin/composer

COPY docker/php/php.ini       /usr/local/etc/php/conf.d/srwa.ini
COPY docker/php/opcache.ini   /usr/local/etc/php/conf.d/opcache.ini

WORKDIR /var/www/html
COPY --from=deps /app/vendor ./vendor
COPY app/ ./

RUN addgroup -g 1000 srwa \
    && adduser  -D -u 1000 -G srwa srwa \
    && chown -R srwa:srwa /var/www/html

USER srwa
EXPOSE 9000
CMD ["php-fpm", "-F"]
